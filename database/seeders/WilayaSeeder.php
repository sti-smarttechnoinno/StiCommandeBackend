<?php

namespace Database\Seeders;

use App\Models\Wilaya;
use Illuminate\Database\Seeder;

class WilayaSeeder extends Seeder
{
    public function run(): void
    {
        $wilayas = [
            ['code' => '01', 'name' => 'Adrar', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '02', 'name' => 'Chlef', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '03', 'name' => 'Laghouat', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '04', 'name' => 'Oum El Bouaghi', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '05', 'name' => 'Batna', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '06', 'name' => 'Béjaïa', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '07', 'name' => 'Biskra', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '08', 'name' => 'Béchar', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '09', 'name' => 'Blida', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '10', 'name' => 'Bouira', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '11', 'name' => 'Tamanrasset', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '12', 'name' => 'Tébessa', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '13', 'name' => 'Tlemcen', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '14', 'name' => 'Tiaret', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '15', 'name' => 'Tizi Ouzou', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '16', 'name' => 'Alger', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '17', 'name' => 'Djelfa', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '18', 'name' => 'Jijel', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '19', 'name' => 'Sétif', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '20', 'name' => 'Saïda', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '21', 'name' => 'Skikda', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '22', 'name' => 'Sidi Bel Abbès', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '23', 'name' => 'Annaba', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '24', 'name' => 'Guelma', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '25', 'name' => 'Constantine', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '26', 'name' => 'Médéa', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '27', 'name' => 'Mostaganem', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '28', 'name' => "M'Sila", 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '29', 'name' => 'Mascara', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '30', 'name' => 'Ouargla', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '31', 'name' => 'Oran', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '32', 'name' => 'El Bayadh', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '33', 'name' => 'Illizi', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '34', 'name' => 'Bordj Bou Arréridj', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '35', 'name' => 'Boumerdès', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '36', 'name' => 'El Tarf', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '37', 'name' => 'Tindouf', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '38', 'name' => 'Tissemsilt', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '39', 'name' => 'El Oued', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '40', 'name' => 'Khenchela', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '41', 'name' => 'Souk Ahras', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '42', 'name' => 'Tipaza', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '43', 'name' => 'Mila', 'region_id' => 'east', 'region_name' => 'East'],
            ['code' => '44', 'name' => 'Aïn Defla', 'region_id' => 'center', 'region_name' => 'Center'],
            ['code' => '45', 'name' => 'Naâma', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '46', 'name' => 'Aïn Témouchent', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '47', 'name' => 'Ghardaïa', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '48', 'name' => 'Relizane', 'region_id' => 'west', 'region_name' => 'West'],
            ['code' => '49', 'name' => 'Timimoun', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '50', 'name' => 'Bordj Badji Mokhtar', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '51', 'name' => 'Ouled Djellal', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '52', 'name' => 'Béni Abbès', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '53', 'name' => 'In Salah', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '54', 'name' => 'In Guezzam', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '55', 'name' => 'Touggourt', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '56', 'name' => 'Djanet', 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '57', 'name' => "El M'Ghair", 'region_id' => 'south', 'region_name' => 'South'],
            ['code' => '58', 'name' => 'El Meniaa', 'region_id' => 'south', 'region_name' => 'South'],
        ];

        foreach ($wilayas as $index => $w) {
            Wilaya::updateOrCreate(
                ['code' => $w['code']],
                [
                    'name' => $w['name'],
                    'region_id' => $w['region_id'],
                    'region_name' => $w['region_name'],
                    'rank' => $index + 1,
                    'delegate_id' => null,
                    'clients_count' => 0,
                    'active_clients_count' => 0,
                    'orders_today' => 0,
                    'orders_month' => 0,
                    'monthly_revenue' => 0,
                    'yearly_revenue' => 0,
                    'avg_order' => 0,
                    'growth' => 0,
                    'performance' => 'good',
                    'performance_score' => 0,
                    'top_product' => '-',
                    'status' => 'active',
                    'revenue_trend' => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    'orders_trend' => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                ]
            );
        }
    }
}
