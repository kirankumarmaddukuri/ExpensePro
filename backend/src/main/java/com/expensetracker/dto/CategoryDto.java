package com.expensetracker.dto;

import com.expensetracker.enums.TransactionType;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryDto {
    private Long id;
    private String name;
    private TransactionType type;
    private String icon;
    private String color;
    private Boolean isDefault;
}
