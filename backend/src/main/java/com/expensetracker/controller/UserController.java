package com.expensetracker.controller;

import com.expensetracker.dto.ApiResponse;
import com.expensetracker.dto.AuthResponse;
import com.expensetracker.dto.UpdateProfileRequest;
import com.expensetracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getCurrentUser(principal.getName())));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> updateCurrentUser(
            @RequestBody UpdateProfileRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", userService.updateCurrentUser(principal.getName(), request)));
    }
}

