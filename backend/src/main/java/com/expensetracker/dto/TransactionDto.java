package com.expensetracker.dto;

import com.expensetracker.enums.PaymentMethod;
import com.expensetracker.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class TransactionDto {
    private Long id;
    private BigDecimal amount;
    private TransactionType type;
    private CategoryDto category;
    private LocalDate transactionDate;
    private String description;
    private PaymentMethod paymentMethod;
    private String attachment;
    private LocalDateTime createdAt;
}
