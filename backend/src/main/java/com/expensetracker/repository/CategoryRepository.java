package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import com.expensetracker.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserIdOrIsDefaultTrue(Long userId);
    List<Category> findByUserIdAndTypeOrIsDefaultTrueAndType(Long userId, TransactionType type, TransactionType defaultType);
    Optional<Category> findByIdAndUserId(Long id, Long userId);
}
