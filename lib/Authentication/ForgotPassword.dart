import 'package:flutter/material.dart';
import '../../services/AuthService.dart';


class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final AuthService _authService = AuthService();

  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  void _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final email = _emailController.text.trim();

    final result = await _authService.forgotPassword(email);
    if (result != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result)),
      );
      Navigator.pushNamed(context, '/NewPassword', arguments: {'email': email});
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to send OTP.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56.0),
        child: Container(
          color: Colors.black,
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset(
                'assets/logoXcinema.png',
                width: 210,
                height: 210,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 0),
              const SizedBox(height: 0),
            ],
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Forgot Password', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.email, color: Colors.white),
                  labelText: 'Email',
                  labelStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.grey[800],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter your email';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _resetPassword,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
                child: const Text('Send'),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/SignIn');
                },
                child: const Text('Back to Sign In', style: TextStyle(color: Colors.blue)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}