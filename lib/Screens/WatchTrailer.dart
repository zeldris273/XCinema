import 'package:flutter/material.dart';

class WatchTrailerScreen extends StatelessWidget {
  const WatchTrailerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text('Watch Trailer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: const Center(
        child: Text('Watch Trailer Screen', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}