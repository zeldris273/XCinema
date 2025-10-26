import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// 📦 Import các màn hình
import 'screens/MainLayout.dart';
import 'screens/HomeScreen.dart';
import 'screens/TvShow.dart';
import 'screens/Movie.dart';
import 'screens/Search.dart';
import 'screens/GenresScreen.dart';
import 'screens/WatchList.dart';
import 'screens/Profile.dart';
import 'screens/PlayNow.dart';
import 'screens/MovieDetail.dart';

// 📦 Import các màn hình Authentication
import 'Authentication/SignIn.dart';
import 'Authentication/SignUp.dart';
import 'Authentication/ForgotPassword.dart';
import 'Authentication/NewPassword.dart';
import 'Authentication/OtpScreen.dart';

// 📦 Provider
import 'state/WatchListProvider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (_) => WatchListProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'XCinema',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: Colors.yellow,
          secondary: Colors.yellow,
        ),
      ),

      // 🔹 Màn hình đầu tiên (login)
      initialRoute: '/SignIn',

      // 🔹 Khai báo tất cả route trong app
      routes: {
        '/main': (context) => const MainLayout(), // layout chính có bottom nav
        '/home': (context) => const HomeScreen(),
        '/tvshows': (context) => const TVShowsScreen(),
        '/movies': (context) => const MoviesScreen(),
        '/search': (context) => const SearchScreen(),
        '/watchlist': (context) => const WatchListScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/genres': (context) => const GenresScreen(),

        // Auth
        '/SignIn': (context) => const SignInScreen(),
        '/SignUp': (context) => const SignUpScreen(),
        '/ForgotPassword': (context) => const ForgotPasswordScreen(),
        '/NewPassword': (context) => const NewPasswordScreen(),
        '/otp': (context) => const OtpScreen(),

        // Màn hình chi tiết phim
        '/moviedetail': (context) => MovieDetailScreen(
          movie: ModalRoute.of(context)!.settings.arguments
          as Map<String, dynamic>,
        ),
      },
    );
  }
}
