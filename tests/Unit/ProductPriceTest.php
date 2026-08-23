<?php

namespace Tests\Unit;

use App\Models\Product;
use Tests\TestCase;

class ProductPriceTest extends TestCase
{
    public function test_selling_price_calculation_for_4_percent_discount(): void
    {
        $product = new Product([
            'nominal_price' => 10000.00,
            'discount_percent' => 4.00,
        ]);

        $this->assertEquals(9600.00, $product->selling_price);
        $this->assertEquals(400.00, $product->discount_amount);
    }
}
