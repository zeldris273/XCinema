import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/ProfileService.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _service = ProfileService();
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  File? _image;
  String _gender = 'Nam';
  String? _avatarUrl;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final data = await _service.getProfile();
    if (data != null) {
      setState(() {
        _emailController.text = data['email'] ?? '';
        _nameController.text = data['displayName'] ?? '';
        _gender = (data['gender'] ?? 'Nam').toString();
        _avatarUrl = data['avatarUrl'];
        _image = null;

        print('Profile loaded: email=${data['email']}, avatar=${data['avatarUrl']}');

      });
    }

    setState(() => _loading = false);
  }

  Future<void> _pickImage() async {
    final pickedFile =
    await ImagePicker().pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() => _image = File(pickedFile.path));
    }
  }

  Future<void> _updateProfile() async {
    final success = await _service.updateProfile(
      name: _nameController.text.trim(),
      gender: _gender,
      avatar: _image,
    );

    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(
        success ? '✅ Cập nhật thành công!' : '❌ Cập nhật thất bại!',
      ),
      backgroundColor: success ? Colors.green : Colors.red,
    ));

    if (success) _fetchProfile();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Profile',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(
        child: CircularProgressIndicator(color: Colors.yellow),
      )
          : SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Cập nhật thông tin tài khoản',
                style: TextStyle(color: Colors.white, fontSize: 18)),
            const SizedBox(height: 20),
            Center(
              child: GestureDetector(
                onTap: _pickImage,
                child: CircleAvatar(
                  radius: 50,
                  backgroundColor: Colors.grey[800],
                  backgroundImage: _image != null
                      ? FileImage(_image!)
                      : (_avatarUrl != null && _avatarUrl!.isNotEmpty
                      ? NetworkImage(_avatarUrl!) // 👈 load ảnh từ backend
                      : null),
                  child: (_image == null && (_avatarUrl == null || _avatarUrl!.isEmpty))
                      ? const Icon(Icons.person, size: 50, color: Colors.white)
                      : null,
                ),
              ),
            ),

            const SizedBox(height: 10),
            const Center(
              child: Text('Cập nhật avatar',
                  style: TextStyle(color: Colors.yellow)),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _emailController,
              enabled: false,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.email, color: Colors.white),
                labelText: 'Email',
                labelStyle: const TextStyle(color: Colors.white),
                filled: true,
                fillColor: Colors.grey[800],
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 10),
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.person, color: Colors.white),
                labelText: 'Tên hiển thị',
                labelStyle: const TextStyle(color: Colors.white),
                filled: true,
                fillColor: Colors.grey[800],
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
            const SizedBox(height: 10),
            const Text('Giới tính',
                style: TextStyle(color: Colors.white)),
            Row(
              children: [
                Radio<String>(
                  value: 'Nam',
                  groupValue: _gender,
                  onChanged: (value) =>
                      setState(() => _gender = value!),
                  activeColor: Colors.yellow,
                ),
                const Text('Nam', style: TextStyle(color: Colors.white)),
                Radio<String>(
                  value: 'Nữ',
                  groupValue: _gender,
                  onChanged: (value) =>
                      setState(() => _gender = value!),
                  activeColor: Colors.yellow,
                ),
                const Text('Nữ', style: TextStyle(color: Colors.white)),
              ],
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _updateProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.yellow,
                foregroundColor: Colors.black,
              ),
              child: const Text('Cập nhật'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, '/ForgotPassword');
              },
              child: const Text('Đổi mật khẩu, nhấn vào đây',
                  style: TextStyle(color: Colors.blue)),
            ),
          ],
        ),
      ),
    );
  }
}
