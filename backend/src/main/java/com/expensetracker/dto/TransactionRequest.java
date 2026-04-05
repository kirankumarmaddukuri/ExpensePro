package com.expensetracker.dto;

import com.expensetracker.enums.PaymentMethod;
import com.expensetracker.enums.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TransactionRequest {
    private BigDecimal amount;
    private TransactionType type;
    private Long categoryId;
    private LocalDate transactionDate;
    private String description;
    private PaymentMethod paymentMethod;
}
