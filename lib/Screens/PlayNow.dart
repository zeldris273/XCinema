// lib/screens/play_now_screen.dart
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:video_player/video_player.dart';
import '../services/TvSeriesService.dart';
import '../services/CommentService.dart';
import '../utils/TokenStorage.dart';
import '../utils/JwtHelper.dart';

class PlayNowScreen extends StatefulWidget {
  final bool isTvSeries;
  final String? videoUrl;
  final int? seriesId;
  final int? movieId;
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

class _PlayNowScreenState extends State<PlayNowScreen>
    with WidgetsBindingObserver {
  // ---------- Controllers ----------
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _commentInputKey = GlobalKey();
  final CommentService _commentService = CommentService();

  // ---------- Data ----------
  List<Map<String, dynamic>> _comments = [];
  bool _isLoadingComments = false;

  int? _replyToCommentId;
  String? _replyToUsername;

  List<Map<String, dynamic>> _seasons = [];
  List<Map<String, dynamic>> _episodes = [];

  int? _selectedSeasonId;
  int? _selectedEpisodeNumber;
  int? _currentEpisodeId;
  String? _currentVideoUrl;

  bool _isLoadingSeasons = false;
  bool _isLoadingEpisodes = false;

  VideoPlayerController? _controller;
  bool _isDisposed = false; // track disposed state

  int? _currentUserId;

  // -----------------------------------------------------------------------
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _loadUserId();
    _loadComments();

    if (widget.isTvSeries && widget.seriesId != null) {
      _fetchSeasons();
    } else if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty) {
      _currentVideoUrl = widget.videoUrl;
      _initializePlayer();
    }
  }

  // ------------------- Lifecycle -------------------
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Chỉ pause khi app thực sự bị background, không phải khi pop screen
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      final route = ModalRoute.of(context);
      if (route == null || !route.isCurrent) {
        // Đang pop màn hình → bỏ qua pause
        return;
      }
      _pauseVideo();
    }
  }

  void _pauseVideo() {
    if (!_isDisposed &&
        _controller != null &&
        _controller!.value.isInitialized) {
      try {
        _controller!.pause();
      } catch (e) {
        debugPrint('Error pausing video: $e');
      }
    }
  }

  // ------------------- Auth -------------------
  Future<void> _loadUserId() async {
    try {
      final token = await TokenStorage.getToken();
      if (token == null) return;
      _currentUserId = JwtHelper.getUserId(token);
    } catch (e) {
      debugPrint('Error loading userId: $e');
    }
  }

  // ------------------- Comments -------------------
  Future<void> _loadComments() async {
    if (_isLoadingComments || _isDisposed) return;
    setState(() => _isLoadingComments = true);

    try {
      List<Map<String, dynamic>> comments;
      if (widget.isTvSeries && widget.seriesId != null) {
        comments = await _commentService.getComments(
          tvSeriesId: widget.seriesId,
          episodeId: _currentEpisodeId,
        );
      } else if (widget.movieId != null) {
        comments = await _commentService.getComments(movieId: widget.movieId);
      } else {
        comments = [];
      }

      if (!_isDisposed && mounted) {
        setState(() {
          _comments = comments;
          _isLoadingComments = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading comments: $e');
      if (!_isDisposed && mounted) {
        setState(() => _isLoadingComments = false);
      }
    }
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty || _currentUserId == null) {
      if (_currentUserId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Please login to comment'),
              backgroundColor: Colors.orange),
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
        parentCommentId: _replyToCommentId,
      );

      if (result != null) {
        _commentController.clear();
        setState(() {
          _replyToCommentId = null;
          _replyToUsername = null;
        });
        _loadComments();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(_replyToCommentId != null
                  ? 'Reply posted!'
                  : 'Comment posted!'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Error adding comment: $e');
    }
  }

  void _cancelReply() {
    setState(() {
      _replyToCommentId = null;
      _replyToUsername = null;
    });
    _commentController.clear();
  }

  Future<void> _deleteComment(int commentId) async {
    if (_currentUserId == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text('Delete Comment',
            style: TextStyle(color: Colors.white)),
        content: const Text('Are you sure?',
            style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey))),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    final ok = await _commentService.deleteComment(
        commentId: commentId, userId: _currentUserId!);
    if (ok && mounted) {
      _loadComments();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Comment deleted'), backgroundColor: Colors.orange),
      );
    }
  }

  // ------------------- TV Series -------------------
  Future<void> _fetchSeasons() async {
    if (_isDisposed) return;
    setState(() => _isLoadingSeasons = true);
    try {
      final data = await TvSeriesService().getSeasons(widget.seriesId!);
      if (!_isDisposed && mounted) {
        setState(() {
          _seasons = data;
          _isLoadingSeasons = false;
        });
        if (_seasons.isNotEmpty) {
          _fetchEpisodes(_seasons.first['id']);
        }
      }
    } catch (e) {
      debugPrint('Error fetching seasons: $e');
      if (!_isDisposed && mounted) {
        setState(() => _isLoadingSeasons = false);
      }
    }
  }

  Future<void> _fetchEpisodes(int seasonId) async {
    if (_isDisposed) return;
    setState(() {
      _isLoadingEpisodes = true;
      _episodes = [];
      _selectedSeasonId = seasonId;
    });
    try {
      final data = await TvSeriesService().getEpisodes(seasonId);
      if (!_isDisposed && mounted) {
        setState(() {
          _episodes = data;
          _isLoadingEpisodes = false;
        });
        if (_episodes.isNotEmpty) {
          final first = _episodes.first;
          _selectedEpisodeNumber = first['episodeNumber'];
          _currentEpisodeId = first['id'];
          _playVideo(first['videoUrl']);
          _loadComments();
        }
      }
    } catch (e) {
      debugPrint('Error fetching episodes: $e');
      if (!_isDisposed && mounted) {
        setState(() => _isLoadingEpisodes = false);
      }
    }
  }

  // ------------------- Video Player -------------------
  Future<void> _initializePlayer() async {
    if (_isDisposed || _currentVideoUrl == null || _currentVideoUrl!.isEmpty) {
      return;
    }

    _controller?.dispose();
    _controller = VideoPlayerController.networkUrl(Uri.parse(_currentVideoUrl!));

    try {
      await _controller!.initialize();
      if (!_isDisposed && mounted) setState(() {});
    } catch (e) {
      debugPrint('Error initializing video: $e');
    }
  }

  void _playVideo(String? url) {
    if (_isDisposed || url == null || url.isEmpty) return;
    setState(() => _currentVideoUrl = url);
    _initializePlayer();
  }

  // ------------------- UI Helpers -------------------
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
      final diff = now.difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inHours < 1) return '${diff.inMinutes}m ago';
      if (diff.inDays < 1) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return DateFormat('MM/dd/yyyy').format(dt);
    } catch (_) {
      return 'Unknown time';
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);

    _controller?.pause();
    _controller?.dispose();

    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // -----------------------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () {
              debugPrint('BACK PRESSED FROM APPBAR - POP');
              Navigator.of(context).pop();
            },
          ),
        ),
        title: Text(
          widget.title ?? (widget.isTvSeries ? 'TV Series' : 'Movie'),
          style: const TextStyle(color: Colors.white),
        ),
      ),
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          // ================= VIDEO AREA =================
          SliverToBoxAdapter(
            child: Container(
              width: double.infinity,
              height: MediaQuery.of(context).size.height * 0.55,
              color: Colors.black,
              child: Stack(
                children: [
                  // 1. VIDEO
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
                          Text('Loading...', style: TextStyle(color: Colors.white70)),
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
                          Text('Select an episode', style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                    ),

                  // 2. TAP TO PLAY/PAUSE (toàn bộ vùng)
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
                        child: Container(color: Colors.transparent),
                      ),
                    ),

                  // 3. ICON PLAY/PAUSE
                  if (_controller != null && _controller!.value.isInitialized)
                    Center(
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
                            _controller!.value.isPlaying ? Icons.pause : Icons.play_arrow,
                            color: Colors.white,
                            size: 50,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ================= CONTENT BELOW =================
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // SEASONS
                if (widget.isTvSeries) ...[
                  _buildSectionTitle('Select Season'),
                  const SizedBox(height: 12),
                  // ... giữ nguyên code seasons/episodes
                  _isLoadingSeasons
                      ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
                      : _seasons.isEmpty
                      ? const Text('No seasons', style: TextStyle(color: Colors.grey))
                      : Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _seasons.map((s) {
                      final selected = _selectedSeasonId == s['id'];
                      return ChoiceChip(
                        label: Text('Season ${s['seasonNumber']}'),
                        selected: selected,
                        onSelected: (_) => _fetchEpisodes(s['id']),
                        selectedColor: Colors.yellow,
                        backgroundColor: Colors.grey[800],
                        labelStyle: TextStyle(
                          color: selected ? Colors.black : Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Episodes'),
                  const SizedBox(height: 12),
                  _isLoadingEpisodes
                      ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
                      : _episodes.isEmpty
                      ? const Text('No episodes', style: TextStyle(color: Colors.grey))
                      : SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _episodes.length,
                      itemBuilder: (_, i) {
                        final e = _episodes[i];
                        final active = _selectedEpisodeNumber == e['episodeNumber'];
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedEpisodeNumber = e['episodeNumber'];
                              _currentEpisodeId = e['id'];
                            });
                            _playVideo(e['videoUrl']);
                            _loadComments();
                          },
                          child: Container(
                            width: 110,
                            margin: const EdgeInsets.only(right: 12),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: active ? Colors.yellow : Colors.grey[800],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: active ? Colors.yellow : Colors.grey[700]!,
                                width: 2,
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.play_circle_outline,
                                    color: active ? Colors.black : Colors.white, size: 28),
                                const SizedBox(height: 6),
                                Text(
                                  'Episode ${e['episodeNumber']}',
                                  style: TextStyle(
                                    color: active ? Colors.black : Colors.white,
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

                // COMMENTS
                _buildSectionTitle('Comments'),
                const SizedBox(height: 12),
                // ... giữ nguyên phần comment input và list
                if (_replyToCommentId != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: Colors.yellow.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.yellow, width: 1),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.reply, color: Colors.yellow, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text('Replying to @$_replyToUsername',
                              style: const TextStyle(color: Colors.yellow, fontWeight: FontWeight.bold)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.yellow, size: 18),
                          onPressed: _cancelReply,
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                      ],
                    ),
                  ),
                Container(
                  key: _commentInputKey,
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _commentController,
                          decoration: InputDecoration(
                            hintText: _replyToCommentId != null ? 'Write a reply...' : 'Add a comment...',
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
                        child: Text(_replyToCommentId != null ? 'Reply' : 'Post',
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                _isLoadingComments
                    ? const Center(child: CircularProgressIndicator(color: Colors.yellow))
                    : _comments.isEmpty
                    ? const Center(child: Text('No comments yet', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _comments.length,
                  itemBuilder: (_, i) => _buildCommentItem(_comments[i]),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  // ------------------- COMMENT ITEM -------------------
  Widget _buildCommentItem(Map<String, dynamic> comment,
      {bool isReply = false}) {
    final isOwner = comment['userId'] == _currentUserId;
    final replies = (comment['replies'] as List?) ?? [];

    final displayName =
        comment['displayName'] ?? comment['username'] ?? 'User';
    final avatarUrl = comment['avatarUrl'];
    final commentText = comment['commentText'] ?? '';
    final commentId = comment['id'];

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
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.yellow,
                backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
                    ? NetworkImage(avatarUrl)
                    : null,
                child: avatarUrl == null || avatarUrl.isEmpty
                    ? Text(displayName[0].toUpperCase(),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.black))
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
                          child: Text(displayName,
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15)),
                        ),
                        if (isOwner)
                          IconButton(
                            icon: const Icon(Icons.delete,
                                size: 18, color: Colors.red),
                            onPressed: () => _deleteComment(commentId),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                      ],
                    ),
                    Text(_formatTimestamp(comment['timestamp']),
                        style:
                        const TextStyle(color: Colors.grey, fontSize: 12)),
                    const SizedBox(height: 8),
                    Text(commentText,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14, height: 1.4)),
                    if (!isReply && _currentUserId != null) ...[
                      const SizedBox(height: 8),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _replyToCommentId = commentId;
                            _replyToUsername = displayName;
                          });
                          Future.delayed(const Duration(milliseconds: 100), () {
                            if (_commentInputKey.currentContext != null) {
                              Scrollable.ensureVisible(
                                  _commentInputKey.currentContext!,
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut);
                            }
                          });
                        },
                        icon: const Icon(Icons.reply,
                            size: 16, color: Colors.grey),
                        label: const Text('Reply',
                            style: TextStyle(color: Colors.grey, fontSize: 13)),
                        style: TextButton.styleFrom(
                            padding: EdgeInsets.zero,
                            minimumSize: const Size(0, 30),
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (replies.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...replies.map((r) => _buildCommentItem(
              Map<String, dynamic>.from(r),
              isReply: true,
            )),
          ],
        ],
      ),
    );
  }

  // ------------------- SECTION TITLE -------------------
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
                color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}