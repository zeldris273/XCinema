import 'package:flutter/material.dart';
import '../../services/AuthService.dart';


class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  _OtpScreenState createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final AuthService _authService = AuthService();
  final _otpControllers = List.generate(6, (_) => TextEditingController());
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;

  void _verifyOtp() async {
    setState(() => _errorMessage = null);

    String otp = _otpControllers.map((c) => c.text).join();
    if (otp.length != 6) {
      setState(() => _errorMessage = "OTP must be 6 digits");
      return;
    }

    final args = ModalRoute.of(context)!.settings.arguments as Map?;
    final email = args?['email'] ?? '';
    final password = args?['password'] ?? '';

    final result = await _authService.verifyOtp(email, otp, password);

    if (result != null) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(result)));
      Navigator.pushReplacementNamed(context, '/SignIn');
    } else {
      setState(() => _errorMessage = 'Invalid OTP or registration failed.');
    }
  }

  void _onOtpChanged(String value, int index) {
    if (value.isNotEmpty && index < 5) {
      FocusScope.of(context).nextFocus();
    } else if (value.isEmpty && index > 0) {
      FocusScope.of(context).previousFocus();
    }
  }

  @override
  void dispose() {
    for (var controller in _otpControllers) {
      controller.dispose();
    }
    super.dispose();
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
              const Text(
                'Enter OTP',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: List.generate(6, (index) {
                  return SizedBox(
                    width: 50,
                    height: 50,
                    child: TextFormField(
                      controller: _otpControllers[index],
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey[800],
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 10,
                          horizontal: 2,
                        ),
                        counterText: '',
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      onChanged: (value) => _onOtpChanged(value, index),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return '';
                        }
                        if (!RegExp(r'^\d$').hasMatch(value)) {
                          return '';
                        }
                        return null;
                      },
                    ),
                  );
                }),
              ),
              const SizedBox(height: 20),
              if (_errorMessage != null)
                Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _verifyOtp,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                child: const Text(
                  'Verify',
                  style: TextStyle(fontSize: 16),
                ),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pushReplacementNamed(context, '/SignIn');
                },
                child: const Text(
                  'Back to Sign In',
                  style: TextStyle(color: Colors.blue),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}