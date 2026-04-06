package com.expensetracker.service;


import com.expensetracker.dto.CategoryDto;
import com.expensetracker.dto.TransactionDto;
import com.expensetracker.dto.TransactionRequest;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Transaction;
import com.expensetracker.entity.User;

import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.TransactionRepository;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<TransactionDto> getTransactions(Long userId, Pageable pageable) {
        // Default to sorting by transactionDate DESC if no sort is specified
        if (pageable.getSort().isUnsorted()) {
            pageable = org.springframework.data.domain.PageRequest.of(
                pageable.getPageNumber(), 
                pageable.getPageSize(), 
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "transactionDate", "id")
            );
        }
        return transactionRepository.findByUserIdAndIsDeletedFalse(userId, pageable)
                .map(this::mapToDto);
    }

    @Transactional
    public TransactionDto createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId).orElseThrow();
        Category category = categoryRepository.findById(request.getCategoryId())
                .filter(c -> c.getUser() == null || c.getUser().getId().equals(userId))
                .orElseThrow();

        Transaction transaction = Transaction.builder()
                .user(user)
                .category(category)
                .amount(request.getAmount())
                .type(request.getType())
                .transactionDate(request.getTransactionDate())
                .description(request.getDescription())
                .paymentMethod(request.getPaymentMethod())
                .isDeleted(false)
                .build();

        return mapToDto(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionDto updateTransaction(Long userId, Long transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .filter(t -> t.getUser().getId().equals(userId))
                .orElseThrow();

        Category category = categoryRepository.findById(request.getCategoryId())
                .filter(c -> c.getUser() == null || c.getUser().getId().equals(userId))
                .orElseThrow();

        transaction.setCategory(category);
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setTransactionDate(request.getTransactionDate());
        transaction.setDescription(request.getDescription());
        transaction.setPaymentMethod(request.getPaymentMethod());

        return mapToDto(transactionRepository.save(transaction));
    }

    @Transactional
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .filter(t -> t.getUser().getId().equals(userId))
                .orElseThrow();
        transaction.setIsDeleted(true);
        transaction.setDeletedAt(LocalDateTime.now());
        transactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary(Long userId) {
        LocalDate now = LocalDate.now();
        LocalDate currentMonthStart = now.withDayOfMonth(1);
        LocalDate currentMonthEnd = currentMonthStart.plusMonths(1).minusDays(1);
        LocalDate lastMonthStart = currentMonthStart.minusMonths(1);
        LocalDate lastMonthEnd = currentMonthStart.minusDays(1);

        BigDecimal income = valueOrZero(transactionRepository.getTotalIncomeByDateRange(userId, currentMonthStart, currentMonthEnd));
        BigDecimal expense = valueOrZero(transactionRepository.getTotalExpensesByDateRange(userId, currentMonthStart, currentMonthEnd));
        BigDecimal balance = income.subtract(expense);

        BigDecimal lastMonthIncome = valueOrZero(transactionRepository.getTotalIncomeByDateRange(userId, lastMonthStart, lastMonthEnd));
        BigDecimal lastMonthExpense = valueOrZero(transactionRepository.getTotalExpensesByDateRange(userId, lastMonthStart, lastMonthEnd));
        BigDecimal lastMonthBalance = lastMonthIncome.subtract(lastMonthExpense);

        Map<String, Object> summary = new HashMap<>();
        summary.put("balance", balance);
        summary.put("totalIncome", income);
        summary.put("totalExpenses", expense);
        summary.put("balanceChangePct", calculatePercentChange(balance, lastMonthBalance));
        summary.put("incomeChangePct", calculatePercentChange(income, lastMonthIncome));
        summary.put("expenseChangePct", calculatePercentChange(expense, lastMonthExpense));
 
        // Add monthly trend (Last 6 months)
        LocalDate sixMonthsAgo = currentMonthStart.minusMonths(5);
        List<Object[]> monthlyData = transactionRepository.findMonthlySpending(userId, sixMonthsAgo);
        summary.put("monthlyTrend", monthlyData);
 
        // Add some recent transactions (Sorted by date DESC)
        List<TransactionDto> recent = transactionRepository.findByUserIdAndIsDeletedFalse(
                userId, 
                org.springframework.data.domain.PageRequest.of(0, 5, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "transactionDate", "createdAt"))
            ).map(this::mapToDto).getContent();
        summary.put("recentTransactions", recent);
 
        return summary;
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal calculatePercentChange(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return current.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(100);
        }
        return current.subtract(previous)
                .divide(previous.abs(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
 
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryAnalytics(Long userId) {
        List<Object[]> categoryData = transactionRepository.findCategorySpending(userId);
        return categoryData.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("name", row[0]);
            map.put("amount", row[1]);
            map.put("color", row[2]);
            map.put("icon", row[3]);
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    private TransactionDto mapToDto(Transaction transaction) {
        return TransactionDto.builder()
                .id(transaction.getId())
                .amount(transaction.getAmount())
                .type(transaction.getType())
                .transactionDate(transaction.getTransactionDate())
                .description(transaction.getDescription())
                .paymentMethod(transaction.getPaymentMethod())
                .attachment(transaction.getAttachment())
                .createdAt(transaction.getCreatedAt())
                .category(CategoryDto.builder()
                        .id(transaction.getCategory().getId())
                        .name(transaction.getCategory().getName())
                        .icon(transaction.getCategory().getIcon())
                        .color(transaction.getCategory().getColor())
                        .type(transaction.getCategory().getType())
                        .build())
                .build();
    }
}
