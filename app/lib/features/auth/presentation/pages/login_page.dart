import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../controller/auth_provider.dart';
import '../widgets/logo_widget.dart';
import '../widgets/login_card.dart';
import '../widgets/username_field.dart';
import '../widgets/password_field.dart';
import '../widgets/remember_me_row.dart';
import '../widgets/login_button.dart';
import '../widgets/biometric_button.dart';
import '../widgets/secure_info_card.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _usernameFocus = FocusNode();
  final _passwordFocus = FocusNode();
  String? _usernameError;
  String? _passwordError;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _usernameFocus.dispose();
    _passwordFocus.dispose();
    super.dispose();
  }

  void _validateAndLogin() {
    setState(() {
      _usernameError = null;
      _passwordError = null;
    });

    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty) {
      setState(() => _usernameError = 'Le nom d\'utilisateur est requis.');
      return;
    }

    if (password.isEmpty) {
      setState(() => _passwordError = 'Le mot de passe est requis.');
      return;
    }

    if (password.length < 4) {
      setState(
          () => _passwordError = 'Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    ref.read(authProvider.notifier).login(username, password);
  }

  void _clearAuthError() {
    final authState = ref.read(authProvider);
    if (authState.status == AuthStatus.error) {
      ref.read(authProvider.notifier).reset();
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (next.status == AuthStatus.authenticated) {
        context.go('/dashboard');
      }
    });

    final authState = ref.watch(authProvider);
    if (authState.status == AuthStatus.authenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          context.go('/dashboard');
        }
      });
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
        systemNavigationBarColor: AppColors.background,
        systemNavigationBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 12),

                  // Logo
                  const LogoWidget(),

                  const SizedBox(height: 24),

                  // Welcome
                  Text(
                    'Connexion',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 100.ms, duration: 400.ms)
                      .slideY(begin: 0.1, end: 0, delay: 100.ms, duration: 400.ms),
                  const SizedBox(height: 6),
                  Text(
                    'Veuillez entrer vos identifiants pour continuer',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 150.ms, duration: 400.ms)
                      .slideY(begin: 0.1, end: 0, delay: 150.ms, duration: 400.ms),

                  const SizedBox(height: 24),

                  // Auth Error Banner
                  Consumer(
                    builder: (context, ref, _) {
                      final authState = ref.watch(authProvider);
                      if (authState.status == AuthStatus.error &&
                          authState.errorMessage != null) {
                        return Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.dangerLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppColors.danger.withAlpha(60),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.error_outline_rounded,
                                color: AppColors.danger,
                                size: 20,
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  authState.errorMessage!,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.danger,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                            .animate()
                            .fadeIn(duration: 200.ms)
                            .shake(
                              hz: 3,
                              curve: Curves.easeOut,
                              duration: 400.ms,
                            );
                      }
                      return const SizedBox.shrink();
                    },
                  ),

                  // Login Card
                  LoginCard(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        UsernameField(
                          controller: _usernameController,
                          errorText: _usernameError,
                          onChanged: (_) {
                            _clearAuthError();
                            if (_usernameError != null) {
                              setState(() => _usernameError = null);
                            }
                          },
                        ),
                        const SizedBox(height: 16),
                        PasswordField(
                          controller: _passwordController,
                          errorText: _passwordError,
                          onChanged: (_) {
                            _clearAuthError();
                            if (_passwordError != null) {
                              setState(() => _passwordError = null);
                            }
                          },
                        ),
                        const SizedBox(height: 14),
                        const RememberMeRow(),
                        const SizedBox(height: 24),
                        LoginButton(onPressed: _validateAndLogin),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Divider
                  Row(
                    children: [
                      const Expanded(
                        child: Divider(
                          color: AppColors.border,
                          thickness: 1,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Ou connecter avec',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ),
                      const Expanded(
                        child: Divider(
                          color: AppColors.border,
                          thickness: 1,
                        ),
                      ),
                    ],
                  )
                      .animate()
                      .fadeIn(delay: 580.ms, duration: 300.ms),

                  const SizedBox(height: 20),

                  // Biometric Button
                  BiometricButton(
                    onPressed: () {
                      ref.read(authProvider.notifier).login('admin', '12345678');
                    },
                  ),

                  const SizedBox(height: 24),

                  // Secure Info
                  const SecureInfoCard(),

                  const SizedBox(height: 20),

                  // Footer
                  Text(
                    'Version 1.0.0 • © STI Distribution',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textTertiary,
                    ),
                  ),

                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
