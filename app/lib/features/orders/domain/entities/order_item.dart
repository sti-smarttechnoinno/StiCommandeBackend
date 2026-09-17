import 'product.dart';

class OrderItem {
  final Product product;
  final int quantity;
  final int? validatedQuantity;
  final double? customDiscountPercent;

  const OrderItem({
    required this.product,
    required this.quantity,
    this.validatedQuantity,
    this.customDiscountPercent,
  });

  double get discountPercent =>
      customDiscountPercent ?? product.discountPercent;

  double get unitPrice =>
      product.nominalPrice * (1 - discountPercent / 100);

  double get subtotal => unitPrice * quantity;

  double get discountTotal =>
      (product.nominalPrice * discountPercent / 100) * quantity;

  int get effectiveValidatedQuantity => validatedQuantity ?? quantity;

  bool get isFullyValidated => effectiveValidatedQuantity >= quantity;

  bool get isVirtual => product.isVirtual;

  OrderItem copyWith({
    int? quantity,
    int? validatedQuantity,
    double? customDiscountPercent,
  }) {
    return OrderItem(
      product: product,
      quantity: quantity ?? this.quantity,
      validatedQuantity: validatedQuantity ?? this.validatedQuantity,
      customDiscountPercent:
          customDiscountPercent ?? this.customDiscountPercent,
    );
  }
}
