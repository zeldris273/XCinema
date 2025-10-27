import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class WatchTrailerScreen extends StatefulWidget {
  final String youtubeUrl;
  const WatchTrailerScreen({super.key, required this.youtubeUrl});

  @override
  State<WatchTrailerScreen> createState() => _WatchTrailerScreenState();
}

class _WatchTrailerScreenState extends State<WatchTrailerScreen> {
  bool _isLoading = false;

  Future<void> _openYouTubeInBrowser() async {
    setState(() => _isLoading = true);

    try {
      final videoId = _getVideoId();
      bool launched = false;

      // ✅ Try YouTube app first (no canLaunchUrl check needed)
      print('🎬 Attempting to open YouTube app...');
      try {
        final youtubeAppUri = Uri.parse('vnd.youtube:$videoId');
        launched = await launchUrl(
          youtubeAppUri,
          mode: LaunchMode.externalApplication,
        );
        print('✅ Opened in YouTube app: $launched');
      } catch (e) {
        print('⚠️ YouTube app not available: $e');
        launched = false;
      }

      // ✅ Fallback to browser
      if (!launched) {
        print('🌐 Opening in browser...');
        try {
          final webUri = Uri.parse(widget.youtubeUrl);
          launched = await launchUrl(
            webUri,
            mode: LaunchMode.externalApplication,
          );
          print('✅ Opened in browser: $launched');
        } catch (e) {
          print('❌ Browser launch failed: $e');

          // ✅ Last resort: try platformDefault mode
          try {
            final webUri = Uri.parse(widget.youtubeUrl);
            launched = await launchUrl(
              webUri,
              mode: LaunchMode.platformDefault,
            );
            print('✅ Opened with platformDefault: $launched');
          } catch (e2) {
            print('❌ All methods failed: $e2');
            throw Exception('Could not open YouTube. Please check your browser settings.');
          }
        }
      }

      if (launched && mounted) {
        // Close this screen after opening
        await Future.delayed(const Duration(milliseconds: 500));
        Navigator.pop(context);
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open YouTube. Please install YouTube app or a browser.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      print('❌ Error opening YouTube: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getVideoId() {
    final uri = Uri.parse(widget.youtubeUrl);
    return uri.queryParameters['v'] ?? '';
  }

  String _getThumbnailUrl() {
    final videoId = _getVideoId();
    return 'https://img.youtube.com/vi/$videoId/maxresdefault.jpg';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Watch Trailer'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // ===== YouTube Thumbnail Preview =====
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Stack(
                    children: [
                      // Thumbnail image
                      Image.network(
                        _getThumbnailUrl(),
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          height: 200,
                          color: Colors.grey[900],
                          child: const Center(
                            child: Icon(
                              Icons.ondemand_video,
                              size: 80,
                              color: Colors.white54,
                            ),
                          ),
                        ),
                      ),

                      // Play overlay
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.7),
                              ],
                            ),
                          ),
                          child: Center(
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.red.withOpacity(0.9),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.red.withOpacity(0.5),
                                    blurRadius: 20,
                                    spreadRadius: 5,
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.play_arrow,
                                color: Colors.white,
                                size: 50,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 40),

              // ===== Watch Button =====
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _openYouTubeInBrowser,
                  icon: _isLoading
                      ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                      : const Icon(Icons.play_circle_filled, size: 28),
                  label: Text(
                    _isLoading ? 'Opening...' : 'Watch on YouTube',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 8,
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ===== Info Text =====
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[900],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: Colors.grey[800]!,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.grey[400],
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'This will open the trailer in YouTube app or browser',
                        style: TextStyle(
                          color: Colors.grey[400],
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}