package com.expensetracker.service;

import com.expensetracker.dto.AuthRequest;
import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.RegisterRequest;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.enums.TransactionType;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Email already in use")
                    .build();
        }

        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .currencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "USD")
                .isActive(true)
                .build();
                
        userRepository.save(user);

        seedDefaultCategories(user);

        return AuthResponse.builder()
                .success(true)
                .message("User registered successfully.")
                .build();
    }

    private void seedDefaultCategories(User user) {
        List<Category> defaultCategories = List.of(
                Category.builder().name("Food & Dining").type(TransactionType.EXPENSE).icon("🍽️").color("#EF4444").user(user).isDefault(false).build(),
                Category.builder().name("Transportation").type(TransactionType.EXPENSE).icon("🚗").color("#3B82F6").user(user).isDefault(false).build(),
                Category.builder().name("Shopping").type(TransactionType.EXPENSE).icon("🛍️").color("#F59E0B").user(user).isDefault(false).build(),
                Category.builder().name("Entertainment").type(TransactionType.EXPENSE).icon("🎬").color("#8b5cf6").user(user).isDefault(false).build(),
                Category.builder().name("Bills & Utilities").type(TransactionType.EXPENSE).icon("💡").color("#10b981").user(user).isDefault(false).build(),
                Category.builder().name("Salary").type(TransactionType.INCOME).icon("💰").color("#10B981").user(user).isDefault(false).build(),
                Category.builder().name("Investment").type(TransactionType.INCOME).icon("📈").color("#3B82F6").user(user).isDefault(false).build()
        );
        categoryRepository.saveAll(defaultCategories);
    }

    public AuthResponse authenticate(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
                
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        var jwtToken = jwtService.generateToken(userDetails);
        var refreshToken = jwtService.generateRefreshToken(userDetails);

        var userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .currencyCode(user.getCurrencyCode())
                .profileImage(user.getProfileImage())
                .build();

        var authData = AuthResponse.AuthData.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400) // 24 hours
                .user(userDto)
                .build();

        return AuthResponse.builder()
                .success(true)
                .message("Login successful")
                .data(authData)
                .build();
    }
}
