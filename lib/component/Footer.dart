import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class Footer extends StatelessWidget {
  const Footer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0xFF1A1A1A),
            Color(0xFF0A0A0A),
          ],
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ===== Brand Section =====
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Colors.yellow, Colors.orange],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.movie_filter,
                  color: Colors.black,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'XCINEMA',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Discover, rate and follow your favorite movies and TV shows. Join our community to share your thoughts!',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
              height: 1.5,
            ),
          ),

          const SizedBox(height: 32),

          // ===== Quick Links Section =====
          _buildSectionTitle('Quick Links'),
          const SizedBox(height: 16),
          Wrap(
            spacing: 24,
            runSpacing: 12,
            children: [
              _buildLink('Home', Icons.home_outlined),
              _buildLink('Movies', Icons.movie_outlined),
              _buildLink('TV Shows', Icons.tv_outlined),
              _buildLink('About', Icons.info_outline),
              _buildLink('Contact', Icons.mail_outline),
            ],
          ),

          const SizedBox(height: 32),

          // ===== Contact Section =====
          _buildSectionTitle('Contact Us'),
          const SizedBox(height: 16),
          _buildContactRow(Icons.email_outlined, 'support@xcinema.com'),
          const SizedBox(height: 12),
          _buildContactRow(Icons.phone_outlined, '+84 123 456 789'),
          const SizedBox(height: 12),
          _buildContactRow(Icons.location_on_outlined, 'Ho Chi Minh City, Vietnam'),

          const SizedBox(height: 32),

          // ===== Social Media Section =====
          _buildSectionTitle('Follow Us'),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildSocialButton(FontAwesomeIcons.facebook, Colors.blue),
              const SizedBox(width: 12),
              _buildSocialButton(FontAwesomeIcons.instagram, Colors.pink),
              const SizedBox(width: 12),
              _buildSocialButton(FontAwesomeIcons.github, Colors.white),
              const SizedBox(width: 12),
              _buildSocialButton(FontAwesomeIcons.xTwitter, Colors.lightBlue),
            ],
          ),

          const SizedBox(height: 32),

          // ===== Divider =====
          Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  Colors.grey[800]!,
                  Colors.transparent,
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // ===== Copyright =====
          Center(
            child: Column(
              children: [
                Text(
                  '© 2025 XCinema. All rights reserved.',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Made with ',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                    const Icon(
                      Icons.favorite,
                      color: Colors.red,
                      size: 12,
                    ),
                    Text(
                      ' by XCinema Team',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 18,
          decoration: BoxDecoration(
            color: Colors.yellow,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildLink(String text, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          color: Colors.yellow,
          size: 14,
        ),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            color: Colors.grey[300],
            fontSize: 13,
          ),
        ),
      ],
    );
  }

  Widget _buildContactRow(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.yellow.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Icon(
            icon,
            color: Colors.yellow,
            size: 16,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: Colors.grey[300],
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton(IconData icon, Color color) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
        ),
      ),
      child: Center(
        child: FaIcon(
          icon,
          color: color,
          size: 20,
        ),
      ),
    );
  }
}