package com.expensetracker.service;

import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.UpdateProfileRequest;
import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AuthResponse.UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return mapToDto(user);
    }

    @Transactional
    public AuthResponse.UserDto updateCurrentUser(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email).orElseThrow();

        String name = request.getName() != null ? request.getName().trim() : "";
        String currencyCode = request.getCurrencyCode() != null ? request.getCurrencyCode().trim().toUpperCase() : "";

        if (!name.isBlank()) {
            user.setName(name);
        }

        if (!currencyCode.isBlank() && currencyCode.length() == 3) {
            user.setCurrencyCode(currencyCode);
        }

        return mapToDto(userRepository.save(user));
    }

    private AuthResponse.UserDto mapToDto(User user) {
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .currencyCode(user.getCurrencyCode())
                .profileImage(user.getProfileImage())
                .build();
    }
}

