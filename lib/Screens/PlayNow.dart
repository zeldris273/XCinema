import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:video_player/video_player.dart';
import '../services/TvSeriesService.dart';
import '../services/CommentService.dart';
import '../utils/TokenStorage.dart';
import 'dart:convert';

class PlayNowScreen extends StatefulWidget {
  final bool isTvSeries;
  final String? videoUrl;
  final int? seriesId;
  final int? movieId; // ✅ Thêm movieId
  final String? title;

  const PlayNowScreen({
    super.key,
    this.isTvSeries = false,
    this.videoUrl,
    this.seriesId,
    this.movieId,
    this.title,
  });

  @override
  State<PlayNowScreen> createState() => _PlayNowScreenState();
}

class _PlayNowScreenState extends State<PlayNowScreen> {
  final TextEditingController _commentController = TextEditingController();
  final CommentService _commentService = CommentService();

  List<Map<String, dynamic>> _comments = [];
  bool _isLoadingComments = false;

  List<Map<String, dynamic>> _seasons = [];
  List<Map<String, dynamic>> _episodes = [];

  int? _selectedSeasonId;
  int? _selectedEpisodeNumber;
  int? _currentEpisodeId; // ✅ Track current episode for comments
  String? _currentVideoUrl;

  bool _isLoadingSeasons = false;
  bool _isLoadingEpisodes = false;

  VideoPlayerController? _controller;

  int? _currentUserId; // ✅ Lưu userId

  @override
  void initState() {
    super.initState();
    _loadUserId();
    _loadComments();

    // ===== DEBUG =====
    print('🔍 PlayNowScreen initState');
    print('🔍 isTvSeries: ${widget.isTvSeries}');
    print('🔍 seriesId: ${widget.seriesId}');
    print('🔍 movieId: ${widget.movieId}');
    print('🔍 videoUrl: ${widget.videoUrl}');
    print('🔍 title: ${widget.title}');
    // ==================

    if (widget.isTvSeries && widget.seriesId != null) {
      print('✅ Detected TV Series - Fetching seasons...');
      _fetchSeasons();
    } else if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty) {
      print('✅ Detected Single Movie - Playing video...');
      _currentVideoUrl = widget.videoUrl;
      _initializePlayer();
    } else {
      print('⚠️ Không có videoUrl hoặc seriesId để phát.');
    }
  }

  /// ✅ Load userId từ token
  /// ✅ Load userId từ token
  Future<void> _loadUserId() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) {
        print('⚠️ No token found');
        return;
      }

      print('🔍 Token exists, decoding...');

      // Decode JWT token để lấy userId
      final parts = token.split('.');
      if (parts.length == 3) {
        final payload = json.decode(
          utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
        );

        print('📦 Token payload: $payload');

        // ✅ Backend .NET dùng key này cho userId
        final userIdString = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

        if (userIdString != null) {
          _currentUserId = int.tryParse(userIdString.toString());
          print('✅ Current userId: $_currentUserId');
        } else {
          print('❌ nameidentifier not found in token');
        }
      } else {
        print('❌ Invalid token format');
      }
    } catch (e, stackTrace) {
      print('❌ Error loading userId: $e');
      print('Stack trace: $stackTrace');
    }
  }

  /// 📜 Load comments từ API
  Future<void> _loadComments() async {
    if (_isLoadingComments) return;

    setState(() => _isLoadingComments = true);

    try {
      List<Map<String, dynamic>> comments;

      if (widget.isTvSeries && widget.seriesId != null) {
        // Load comments cho TV Series (có thể filter theo episode)
        comments = await _commentService.getComments(
          tvSeriesId: widget.seriesId,
          episodeId: _currentEpisodeId,
        );
      } else if (widget.movieId != null) {
        // Load comments cho Movie
        comments = await _commentService.getComments(
          movieId: widget.movieId,
        );
      } else {
        comments = [];
      }

      // ✅ DEBUG: In ra comment đầu tiên
      if (comments.isNotEmpty) {
        print('📦 First comment structure:');
        print('   - id: ${comments[0]['id']}');
        print('   - userId: ${comments[0]['userId']}');
        print('   - username: ${comments[0]['username']}');
        print('   - displayName: ${comments[0]['displayName']}');
        print('   - avatarUrl: ${comments[0]['avatarUrl']}');
        print('   - commentText: ${comments[0]['commentText']}');
      }

      setState(() {
        _comments = comments;
        _isLoadingComments = false;
      });
    } catch (e) {
      print('❌ Error loading comments: $e');
      setState(() => _isLoadingComments = false);
    }
  }

  /// ✍️ Thêm comment
  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty || _currentUserId == null) {
      if (_currentUserId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please login to comment'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    try {
      final result = await _commentService.addComment(
        userId: _currentUserId!,
        commentText: _commentController.text.trim(),
        movieId: widget.movieId,
        tvSeriesId: widget.seriesId,
        episodeId: _currentEpisodeId,
      );

      if (result != null) {
        _commentController.clear();
        _loadComments(); // Reload comments

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Comment posted successfully!'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to post comment'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      print('❌ Error adding comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// 🗑️ Xóa comment
  Future<void> _deleteComment(int commentId) async {
    if (_currentUserId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('Delete Comment', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Are you sure you want to delete this comment?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final success = await _commentService.deleteComment(
      commentId: commentId,
      userId: _currentUserId!,
    );

    if (success) {
      _loadComments();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Comment deleted'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to delete comment'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // ===== FETCH SEASONS =====
  Future<void> _fetchSeasons() async {
    setState(() => _isLoadingSeasons = true);
    print('🔵 Fetching seasons for seriesId: ${widget.seriesId}');

    try {
      final data = await TvSeriesService().getSeasons(widget.seriesId!);

      setState(() {
        _seasons = data;
        _isLoadingSeasons = false;
      });

      print('✅ Received ${_seasons.length} season(s)');

      if (_seasons.isNotEmpty) {
        final firstSeasonId = _seasons.first['id'];
        _fetchEpisodes(firstSeasonId);
      } else {
        print('⚠️ No seasons found for this series.');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No seasons found for this series')),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoadingSeasons = false);
      print('❌ Error fetching seasons: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch seasons: $e')),
        );
      }
    }
  }

  // ===== FETCH EPISODES =====
  Future<void> _fetchEpisodes(int seasonId) async {
    setState(() {
      _isLoadingEpisodes = true;
      _episodes = [];
      _selectedSeasonId = seasonId;
    });

    print('🔵 Fetching episodes for seasonId: $seasonId');

    try {
      final data = await TvSeriesService().getEpisodes(seasonId);

      setState(() {
        _episodes = data;
        _isLoadingEpisodes = false;
      });

      print('✅ Received ${_episodes.length} episode(s)');

      if (_episodes.isNotEmpty) {
        final firstEpisode = _episodes.first;
        _selectedEpisodeNumber = firstEpisode['episodeNumber'];
        _currentEpisodeId = firstEpisode['id']; // ✅ Set current episode
        _playVideo(firstEpisode['videoUrl']);
        _loadComments(); // ✅ Load comments for this episode
      } else {
        print('⚠️ No episodes found for this season.');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No episodes found for this season')),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoadingEpisodes = false);
      print('❌ Error fetching episodes: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch episodes: $e')),
        );
      }
    }
  }

  // ===== INITIALIZE VIDEO PLAYER =====
  Future<void> _initializePlayer() async {
    print('🎥 _initializePlayer called');
    print('🎥 Current video URL: $_currentVideoUrl');

    if (_currentVideoUrl == null || _currentVideoUrl!.isEmpty) {
      print('⚠️ Không có videoUrl để phát.');
      return;
    }

    print('🎬 Initializing video: $_currentVideoUrl');

    _controller?.dispose();
    _controller = VideoPlayerController.networkUrl(Uri.parse(_currentVideoUrl!));

    try {
      await _controller!.initialize();
      print('✅ Video initialized successfully!');

      if (mounted) {
        setState(() {});
        _controller!.play();
        print('✅ Playback started!');
      }
    } catch (e) {
      print('❌ Lỗi khởi tạo video player: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading video: $e')),
        );
      }
    }
  }

  // ===== PLAY VIDEO =====
  void _playVideo(String? url) {
    print('🎯 _playVideo called');
    print('🎯 URL received: $url');

    if (url == null || url.isEmpty) {
      print('⚠️ URL rỗng, không thể phát video.');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid video URL')),
      );
      return;
    }

    print('✅ Setting video URL to: $url');
    setState(() => _currentVideoUrl = url);
    _initializePlayer();
  }

  /// ✅ Format timestamp
  String _formatTimestamp(dynamic timestamp) {
    try {
      DateTime dt;
      if (timestamp is String) {
        dt = DateTime.parse(timestamp);
      } else if (timestamp is DateTime) {
        dt = timestamp;
      } else {
        return 'Unknown time';
      }

      final now = DateTime.now();
      final difference = now.difference(dt);

      if (difference.inMinutes < 1) {
        return 'Just now';
      } else if (difference.inHours < 1) {
        return '${difference.inMinutes}m ago';
      } else if (difference.inDays < 1) {
        return '${difference.inHours}h ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}d ago';
      } else {
        return DateFormat('MM/dd/yyyy').format(dt);
      }
    } catch (e) {
      return 'Unknown time';
    }
  }

  @override
  void dispose() {
    print('🔴 Disposing PlayNowScreen');
    _controller?.pause(); // ✅ Pause trước khi dispose
    _controller?.dispose();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      // ✅ Fix lỗi back button
      onWillPop: () async {
        print('🔙 Back button pressed - pausing video');
        _controller?.pause();
        return true; // Allow navigation
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ===== VIDEO PLAYER =====
              Container(
                color: Colors.black,
                width: double.infinity,
                height: MediaQuery.of(context).size.height * 0.55,
                child: Stack(
                  children: [
                    if (_controller != null && _controller!.value.isInitialized)
                      Center(
                        child: AspectRatio(
                          aspectRatio: _controller!.value.aspectRatio,
                          child: VideoPlayer(_controller!),
                        ),
                      )
                    else if (_isLoadingSeasons || _isLoadingEpisodes)
                      const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            CircularProgressIndicator(color: Colors.yellow),
                            SizedBox(height: 16),
                            Text(
                              'Loading...',
                              style: TextStyle(color: Colors.white70, fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    else
                      const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.play_circle_fill, color: Colors.white70, size: 80),
                            SizedBox(height: 16),
                            Text(
                              'Select an episode to play',
                              style: TextStyle(color: Colors.white70, fontSize: 16),
                            ),
                          ],
                        ),
                      ),

                    // ✅ Back button - Fix lỗi
                    Positioned(
                      top: 40,
                      left: 16,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.5),
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back, color: Colors.white),
                          onPressed: () {
                            print('🔙 Back button tapped - pausing video');
                            _controller?.pause(); // ✅ Pause video
                            Navigator.pop(context);
                          },
                        ),
                      ),
                    ),

                    // Play/Pause overlay
                    if (_controller != null && _controller!.value.isInitialized)
                      Positioned.fill(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _controller!.value.isPlaying
                                  ? _controller!.pause()
                                  : _controller!.play();
                            });
                          },
                          child: Container(
                            color: Colors.transparent,
                            child: Center(
                              child: AnimatedOpacity(
                                opacity: _controller!.value.isPlaying ? 0.0 : 1.0,
                                duration: const Duration(milliseconds: 300),
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.5),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _controller!.value.isPlaying
                                        ? Icons.pause
                                        : Icons.play_arrow,
                                    color: Colors.white,
                                    size: 50,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (widget.isTvSeries) ...[
                      // ===== SEASON SELECTOR =====
                      _buildSectionTitle('Select Season'),
                      const SizedBox(height: 12),

                      _isLoadingSeasons
                          ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
                          : _seasons.isEmpty
                          ? const Text('No seasons available', style: TextStyle(color: Colors.grey))
                          : Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _seasons.map((s) {
                          final isSelected = _selectedSeasonId == s['id'];
                          return ChoiceChip(
                            label: Text('Season ${s['seasonNumber']}'),
                            selected: isSelected,
                            onSelected: (_) => _fetchEpisodes(s['id']),
                            selectedColor: Colors.yellow,
                            backgroundColor: Colors.grey[800],
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.black : Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          );
                        }).toList(),
                      ),

                      const SizedBox(height: 24),

                      // ===== EPISODE SELECTOR =====
                      _buildSectionTitle('Episodes'),
                      const SizedBox(height: 12),

                      _isLoadingEpisodes
                          ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
                          : _episodes.isEmpty
                          ? const Text('No episodes available', style: TextStyle(color: Colors.grey))
                          : SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _episodes.length,
                          itemBuilder: (context, index) {
                            final e = _episodes[index];
                            final isActive = _selectedEpisodeNumber == e['episodeNumber'];
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedEpisodeNumber = e['episodeNumber'];
                                  _currentEpisodeId = e['id']; // ✅ Update episode
                                });
                                _playVideo(e['videoUrl']);
                                _loadComments(); // ✅ Reload comments
                              },
                              child: Container(
                                width: 110,
                                margin: const EdgeInsets.only(right: 12),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: isActive ? Colors.yellow : Colors.grey[800],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isActive ? Colors.yellow : Colors.grey[700]!,
                                    width: 2,
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.play_circle_outline,
                                      color: isActive ? Colors.black : Colors.white,
                                      size: 28,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Episode ${e['episodeNumber']}',
                                      style: TextStyle(
                                        color: isActive ? Colors.black : Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                      const SizedBox(height: 32),
                    ],

                    // ===== COMMENT SECTION =====
                    _buildSectionTitle('Comments'),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _commentController,
                            decoration: InputDecoration(
                              hintText: 'Add a comment...',
                              hintStyle: const TextStyle(color: Colors.grey),
                              filled: true,
                              fillColor: Colors.grey[850],
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            style: const TextStyle(color: Colors.white),
                            maxLines: null,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (_) => _addComment(),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _addComment,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.yellow,
                            foregroundColor: Colors.black,
                            minimumSize: const Size(60, 50),
                          ),
                          child: const Text('Post', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    _isLoadingComments
                        ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: CircularProgressIndicator(color: Colors.yellow),
                      ),
                    )
                        : _comments.isEmpty
                        ? const Center(
                      child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: Text(
                          'No comments yet. Be the first to comment!',
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    )
                        : ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _comments.length,
                      itemBuilder: (context, index) {
                        return _buildCommentItem(_comments[index]);
                      },
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

  // ✅ Build comment item (hỗ trợ replies)
  Widget _buildCommentItem(Map<String, dynamic> comment, {bool isReply = false}) {
    final isOwner = comment['userId'] == _currentUserId;
    final replies = comment['replies'] as List? ?? [];

    // ✅ Lấy thông tin user
    final displayName = comment['displayName'] ?? comment['username'] ?? 'User';
    final avatarUrl = comment['avatarUrl'];
    final commentText = comment['commentText'] ?? '';

    return Container(
      margin: EdgeInsets.only(
        bottom: 16,
        left: isReply ? 40 : 0,
      ),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isReply ? Colors.grey[900] : Colors.grey[850],
        borderRadius: BorderRadius.circular(8),
        border: isReply
            ? const Border(left: BorderSide(color: Colors.yellow, width: 3))
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ✅ Avatar
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.yellow,
                backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                    ? NetworkImage(avatarUrl)
                    : null,
                child: avatarUrl == null || avatarUrl.isEmpty
                    ? Text(
                  displayName[0].toUpperCase(),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        if (isOwner)
                          IconButton(
                            icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                            onPressed: () => _deleteComment(comment['id']),
                            constraints: const BoxConstraints(),
                            padding: EdgeInsets.zero,
                          ),
                      ],
                    ),
                    Text(
                      _formatTimestamp(comment['timestamp']),
                      style: const TextStyle(
                        color: Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      commentText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // ✅ Hiển thị replies (nếu có)
          if (replies.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...replies.map((reply) => _buildCommentItem(
              Map<String, dynamic>.from(reply),
              isReply: true,
            )),
          ],
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: Colors.yellow,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}