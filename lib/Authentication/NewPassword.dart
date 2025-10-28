import 'package:flutter/material.dart';
import '../../services/AuthService.dart';


class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key});

  @override
  _NewPasswordScreenState createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final AuthService _authService = AuthService();

  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  void _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final args = ModalRoute.of(context)!.settings.arguments as Map?;
    final email = args?['email'] ?? '';

    // ⚠️ Khi user nhập OTP sau forgot password, có thể hiển thị TextField OTP riêng
    final otp = await _showOtpDialog(context);
    if (otp == null || otp.isEmpty) return;

    final newPassword = _newPasswordController.text.trim();

    final result = await _authService.resetPassword(email, otp, newPassword);
    if (result != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(result)));
      Navigator.pushReplacementNamed(context, '/SignIn');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to reset password.')),
      );
    }
  }

  Future<String?> _showOtpDialog(BuildContext context) async {
    String otp = '';
    return showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enter OTP'),
        content: TextField(
          onChanged: (value) => otp = value,
          decoration: const InputDecoration(hintText: '6-digit OTP'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, otp),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
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
              const Text('New Password', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextFormField(
                controller: _newPasswordController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.lock, color: Colors.white),
                  labelText: 'Enter New Password',
                  labelStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.grey[800],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter new password';
                  return null;
                },
              ),
              const SizedBox(height: 10),
              TextFormField(
                controller: _confirmPasswordController,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.lock, color: Colors.white),
                  labelText: 'Confirm Password',
                  labelStyle: const TextStyle(color: Colors.white),
                  filled: true,
                  fillColor: Colors.grey[800],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please confirm your password';
                  if (value != _newPasswordController.text) return 'Passwords do not match';
                  return null;
                },
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _submit,
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
                child: const Text('Submit'),
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