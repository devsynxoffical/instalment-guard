import 'package:flutter_test/flutter_test.dart';
import 'package:installment_guard/main.dart';

void main() {
  testWidgets('Installment Guard app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const InstallmentGuardApp());
    expect(find.byType(InstallmentGuardApp), findsOneWidget);
  });
}
