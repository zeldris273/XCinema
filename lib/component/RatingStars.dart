import 'package:flutter/material.dart';

class RatingStars extends StatefulWidget {
  final double initialRating; // 0.0 - 1.0 (0.1 = 1 sao, 1.0 = 10 sao)
  final Function(double) onRatingChanged;

  const RatingStars({
    super.key,
    required this.initialRating,
    required this.onRatingChanged,
  });

  @override
  State<RatingStars> createState() => _RatingStarsState();
}

class _RatingStarsState extends State<RatingStars> {
  late double _currentRating;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.initialRating;
    print('🌟 RatingStars init: ${widget.initialRating}');
  }

  @override
  void didUpdateWidget(covariant RatingStars oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialRating != oldWidget.initialRating) {
      setState(() {
        _currentRating = widget.initialRating;
        print('🔄 RatingStars updated: ${widget.initialRating}');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Hiển thị số sao đã chọn
        if (_currentRating > 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              'Your Rating: ${(_currentRating * 10).toInt()}/10',
              style: const TextStyle(
                color: Colors.yellow,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

        // 10 ngôi sao
        Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(10, (index) {
            final starNumber = index + 1; // 1-10
            final starValue = starNumber / 10.0; // 0.1, 0.2, ... 1.0
            final isFilled = _currentRating >= starValue;

            return GestureDetector(
              onTap: () {
                setState(() => _currentRating = starValue);
                widget.onRatingChanged(starValue); // Trả về 0.1 - 1.0
                print('⭐ Selected: $starNumber stars (value: $starValue)');
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: Icon(
                  isFilled ? Icons.star : Icons.star_border,
                  color: isFilled ? Colors.yellow : Colors.grey,
                  size: 32,
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}