package com.expensetracker.repository;

import com.expensetracker.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    Page<Transaction> findByUserIdAndIsDeletedFalse(Long userId, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.isDeleted = false " +
           "AND (:startDate IS NULL OR t.transactionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.transactionDate <= :endDate) ")
    List<Transaction> findTransactionsByDateRange(
            @Param("userId") Long userId, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
            
    @Query("SELECT t FROM Transaction t WHERE t.user.id = :userId AND t.isDeleted = false")
    List<Transaction> findAllActiveByUserId(@Param("userId") Long userId);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'INCOME'")
    java.math.BigDecimal getTotalIncome(@Param("userId") Long userId);
    
    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'EXPENSE'")
    java.math.BigDecimal getTotalExpenses(@Param("userId") Long userId);

    @Query("SELECT SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'INCOME' " +
           "AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate")
    java.math.BigDecimal getTotalIncomeByDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(t.amount) FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'EXPENSE' " +
           "AND t.transactionDate >= :startDate AND t.transactionDate <= :endDate")
    java.math.BigDecimal getTotalExpensesByDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT " +
           "  EXTRACT(YEAR FROM t.transactionDate) as year, " +
           "  EXTRACT(MONTH FROM t.transactionDate) as month, " +
           "  SUM(t.amount) as total " +
           "FROM Transaction t " +
           "WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'EXPENSE' " +
           "AND t.transactionDate >= :startDate " +
           "GROUP BY EXTRACT(YEAR FROM t.transactionDate), EXTRACT(MONTH FROM t.transactionDate) " +
           "ORDER BY year, month")
    List<Object[]> findMonthlySpending(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);

    @Query("SELECT c.name, SUM(t.amount), c.color, c.icon " +
           "FROM Transaction t " +
           "JOIN t.category c " +
           "WHERE t.user.id = :userId AND t.isDeleted = false AND t.type = 'EXPENSE' " +
           "GROUP BY c.name, c.color, c.icon")
    List<Object[]> findCategorySpending(@Param("userId") Long userId);
}
