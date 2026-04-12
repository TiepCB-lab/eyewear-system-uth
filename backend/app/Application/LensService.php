<?php

namespace App\Application;

use Core\Database;

class LensService
{
    /**
     * Get lenses that are compatible with a specific product variant.
     *
     * The current schema does not store a direct lens-to-variant compatibility table,
     * so compatibility is inferred from the variant/product metadata that exists today.
     */
    public function getAvailableLensesForVariant(int $variantId): array
    {
        $db = Database::getInstance();

        $variantStmt = $db->prepare(
            'SELECT
                pv.id AS variant_id,
                pv.product_id,
                pv.sku,
                pv.color,
                pv.size_code,
                pv.size,
                pv.stock_quantity,
                p.name AS product_name,
                p.model_name,
                p.description,
                p.gender,
                p.is_active
            FROM productvariant pv
            INNER JOIN product p ON p.id = pv.product_id
            WHERE pv.id = ?
            LIMIT 1'
        );
        $variantStmt->execute([$variantId]);
        $variant = $variantStmt->fetch();

        if (!$variant) {
            throw new \RuntimeException('Product variant not found.');
        }

        $profile = $this->buildCompatibilityProfile($variant);

        $lensStmt = $db->query(
            'SELECT id, name, type, lens_type, material, index_value, coating, price, created_at, updated_at
             FROM lens
             ORDER BY price ASC, name ASC, id ASC'
        );
        $lenses = $lensStmt->fetchAll() ?: [];

        $availableLenses = [];
        foreach ($lenses as $lens) {
            $compatibility = $this->evaluateLensCompatibility($lens, $profile);
            if (!$compatibility['is_compatible']) {
                continue;
            }

            $availableLenses[] = [
                'id' => (int) $lens['id'],
                'name' => $lens['name'],
                'type' => $lens['type'],
                'lens_type' => $lens['lens_type'],
                'material' => $lens['material'],
                'index_value' => $lens['index_value'] !== null ? (float) $lens['index_value'] : null,
                'coating' => $lens['coating'],
                'price' => (float) $lens['price'],
                'compatibility' => $compatibility,
            ];
        }

        return [
            'variant' => [
                'id' => (int) $variant['variant_id'],
                'product_id' => (int) $variant['product_id'],
                'sku' => $variant['sku'],
                'color' => $variant['color'],
                'size_code' => $variant['size_code'],
                'size' => $variant['size'],
                'stock_quantity' => (int) $variant['stock_quantity'],
                'product_name' => $variant['product_name'],
                'model_name' => $variant['model_name'],
                'gender' => $variant['gender'],
                'is_active' => (bool) $variant['is_active'],
            ],
            'compatibility_profile' => $profile,
            'available_lenses' => $availableLenses,
            'total_available' => count($availableLenses),
        ];
    }

    private function buildCompatibilityProfile(array $variant): array
    {
        $variantLabel = strtolower(trim(implode(' ', array_filter([
            (string) ($variant['product_name'] ?? ''),
            (string) ($variant['model_name'] ?? ''),
            (string) ($variant['description'] ?? ''),
        ]))));
        $sizeToken = strtolower(trim((string) ($variant['size_code'] ?? $variant['size'] ?? '')));

        $isKidsFrame = ($variant['gender'] ?? null) === 'kids'
            || preg_match('/\b(kid|kids|child|children|junior|youth)\b/i', $variantLabel) === 1;

        $isCompactFrame = (bool) preg_match('/^(xxs|xs|s|small|kids?|junior|youth)$/i', $sizeToken);

        $supportLevel = 'standard';
        if ($isKidsFrame) {
            $supportLevel = 'kids';
        } elseif ($isCompactFrame) {
            $supportLevel = 'compact';
        }

        return [
            'support_level' => $supportLevel,
            'supports_single_vision' => true,
            'supports_bifocal' => $supportLevel === 'standard',
            'supports_progressive' => $supportLevel === 'standard',
            'notes' => $supportLevel === 'standard'
                ? 'All lens types are available for this frame variant.'
                : 'Only single vision lenses are exposed for compact or kids frame variants.',
        ];
    }

    private function evaluateLensCompatibility(array $lens, array $profile): array
    {
        $lensType = strtolower(trim((string) ($lens['type'] ?? $lens['lens_type'] ?? '')));

        $isCompatible = true;
        $reason = 'Compatible with this variant.';

        if ($lensType === 'single_vision') {
            $isCompatible = true;
            $reason = 'Single vision lenses are supported for every variant.';
        } elseif ($lensType === 'bifocal') {
            $isCompatible = (bool) $profile['supports_bifocal'];
            $reason = $isCompatible
                ? 'Bifocal lenses are supported for this frame size/profile.'
                : 'Bifocal lenses are not recommended for compact or kids frame variants.';
        } elseif ($lensType === 'progressive') {
            $isCompatible = (bool) $profile['supports_progressive'];
            $reason = $isCompatible
                ? 'Progressive lenses are supported for this frame size/profile.'
                : 'Progressive lenses are not recommended for compact or kids frame variants.';
        }

        return [
            'is_compatible' => $isCompatible,
            'reason' => $reason,
            'support_level' => $profile['support_level'],
        ];
    }
}