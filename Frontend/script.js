const BASE_URL = "https://scs-m5an.onrender.com/api";


// ================= REGISTER =================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem("verificationEmail", email);

                Swal.fire({
                    icon: "success",
                    title: "Registration Successful",
                    text: data.message || "Please verify your email.",
                    timer: 2500,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "verify-email.html";
                }, 2500);

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Registration Failed",
                    text: data.message || "Registration failed"
                });

            }

        } catch (error) {

            console.error("REGISTER ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= LOGIN =================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {

                // Save token
                localStorage.setItem("token", data.token);

                // Save user with consistent name field
                const user = {
                    id: data.user?.id || data.user?._id || "",
                    name: data.user?.name || "",
                    email: data.user?.email || "",
                    role: data.user?.role || "user"
                };

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

                Swal.fire({
                    icon: "success",
                    title: "Login Successful",
                    timer: 1200,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "dashboard.html";
                }, 1200);

            } else {

                if (data.needsVerification) {

                    localStorage.setItem(
                        "verificationEmail",
                        data.email || email
                    );

                    Swal.fire({
                        icon: "warning",
                        title: "Email Not Verified",
                        text: data.message || "Please verify your email.",
                        confirmButtonText: "Verify Email"
                    }).then(() => {
                        window.location.href = "verify-email.html";
                    });

                    return;
                }

                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: data.message || "Login failed"
                });

            }

        } catch (error) {

            console.error("LOGIN ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= ADMIN LOGIN =================

const adminLoginForm =
    document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {

                if (!data.user || data.user.role !== "admin") {

                    return Swal.fire({
                        icon: "error",
                        title: "Access Denied",
                        text: "This account is not an administrator."
                    });

                }

                const user = {
                    id: data.user.id || data.user._id || "",
                    name: data.user.name || "",
                    email: data.user.email || "",
                    role: data.user.role
                };

                localStorage.setItem("token", data.token);

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

                Swal.fire({
                    icon: "success",
                    title: "Welcome Admin",
                    timer: 1200,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "admin-dashboard.html";
                }, 1200);

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Login Failed",
                    text: data.message || "Login failed"
                });

            }

        } catch (error) {

            console.error("ADMIN LOGIN ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= VERIFY EMAIL =================

const verifyEmailForm =
    document.getElementById("verifyEmailForm");

if (verifyEmailForm) {
    verifyEmailForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const code = document.getElementById("code").value.trim();

        try {
            const response = await fetch(`${BASE_URL}/auth/verify-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    code
                })
            });

            const data = await response.json();

            if (response.ok) {

                localStorage.removeItem("verificationEmail");

                Swal.fire({
                    icon: "success",
                    title: "Email Verified!",
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2000);

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Verification Failed",
                    text: data.message || "Verification failed"
                });

            }

        } catch (error) {

            console.error("VERIFY EMAIL ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= RESEND VERIFICATION =================

const resendVerificationForm =
    document.getElementById("resendVerificationForm");

if (resendVerificationForm) {
    resendVerificationForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        try {
            const response = await fetch(
                `${BASE_URL}/auth/resend-verification`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem(
                    "verificationEmail",
                    email
                );

                Swal.fire({
                    icon: "success",
                    title: "Code Sent",
                    text: data.message
                });

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.message || "Could not resend code"
                });

            }

        } catch (error) {

            console.error("RESEND ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= FORGOT PASSWORD =================

const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();

        try {
            const response = await fetch(
                `${BASE_URL}/auth/forgot-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem(
                    "resetEmail",
                    email
                );

                Swal.fire({
                    icon: "success",
                    title: "Reset Code Sent",
                    text: data.message,
                    timer: 2200,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "reset-password.html";
                }, 2200);

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: data.message || "Could not send reset code"
                });

            }

        } catch (error) {

            console.error("FORGOT PASSWORD ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}


// ================= RESET PASSWORD =================

const resetPasswordForm =
    document.getElementById("resetPasswordForm");

if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const code = document.getElementById("code").value.trim();

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {

            return Swal.fire({
                icon: "error",
                title: "Passwords Do Not Match",
                text: "Please enter the same password in both fields."
            });

        }

        if (newPassword.length < 6) {

            return Swal.fire({
                icon: "warning",
                title: "Password Too Short",
                text: "Password must be at least 6 characters."
            });

        }

        try {
            const response = await fetch(
                `${BASE_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        code,
                        newPassword
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                localStorage.removeItem("resetEmail");

                Swal.fire({
                    icon: "success",
                    title: "Password Reset Successful",
                    text: data.message,
                    timer: 2200,
                    showConfirmButton: false
                });

                setTimeout(() => {
                    window.location.href = "login.html";
                }, 2200);

            } else {

                Swal.fire({
                    icon: "error",
                    title: "Password Reset Failed",
                    text: data.message || "Password reset failed"
                });

            }

        } catch (error) {

            console.error("RESET PASSWORD ERROR:", error);

            Swal.fire({
                icon: "error",
                title: "Server Error",
                text: "Could not connect to the server."
            });

        }
    });
}