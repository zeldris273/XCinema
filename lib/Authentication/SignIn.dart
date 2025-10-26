import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import '../services/AuthService.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  _SignInScreenState createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;
  bool _loading = false;

  void _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _errorMessage = null;
      _loading = true;
    });

    final success = await AuthService().login(
      _emailController.text.trim(),
      _passwordController.text.trim(),
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Login successful!')),
      );
      Navigator.pushReplacementNamed(context, '/main');
    } else {
      setState(() => _errorMessage = 'Invalid email or password.');
    }

    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/logoXcinema.png',  // Đường dẫn Logo ở đâyyyyyyy
                width: 210,
                height: 210,
                fit: BoxFit.contain, // Tỷ lệ ảnh
              ),
              const SizedBox(height: 0),  // Khoảng cách với phần dưới
              const SizedBox(height: 0),
              const Text(
                'Sign In',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.email, color: Colors.white),
                  labelText: 'Email',
                  labelStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.grey[800],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                validator: (value) =>
                (value == null || value.isEmpty) ? 'Please enter your email' : null,
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.lock, color: Colors.white),
                  labelText: 'Password',
                  labelStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.grey[800],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                validator: (value) =>
                (value == null || value.isEmpty) ? 'Please enter your password' : null,
              ),
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/ForgotPassword');
                  },
                  child: const Text(
                    'Forgot Password?',
                    style: TextStyle(color: Colors.yellow),
                  ),
                ),
              ),
              const SizedBox(height: 5),
              if (_errorMessage != null)
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              const SizedBox(height: 5),
              _loading
                  ? const CircularProgressIndicator(color: Colors.yellow)
                  : ElevatedButton(
                onPressed: _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 100, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text('Login'),
              ),
              //const SizedBox(height: 20),
              // const Text('Or sign in with', style: TextStyle(color: Colors.grey)),
              // const SizedBox(height: 10),
              // Row(
              //   mainAxisAlignment: MainAxisAlignment.center,
              //   children: [
              //     ElevatedButton(
              //       onPressed: () {
              //         AuthService().loginWithGoogle();
              //       },
              //       style: ElevatedButton.styleFrom(
              //         backgroundColor: Colors.red,
              //         shape: const CircleBorder(),
              //       ),
              //       child: const FaIcon(FontAwesomeIcons.google, color: Colors.white),
              //     ),
              //     const SizedBox(width: 10),
              //     ElevatedButton(
              //       onPressed: () {
              //         AuthService().loginWithGitHub();
              //       },
              //       style: ElevatedButton.styleFrom(
              //         backgroundColor: Colors.grey[800],
              //         shape: const CircleBorder(),
              //       ),
              //       child: const FaIcon(FontAwesomeIcons.github, color: Colors.white),
              //     ),
              //   ],
              // ),
              const SizedBox(height: 20),
              TextButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/SignUp');
                },
                child: const Text(
                  "Don't have an account? Sign Up",
                  style: TextStyle(color: Colors.yellow),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
