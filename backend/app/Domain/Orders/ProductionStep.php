<?php

namespace App\Domain\Orders;

final class ProductionStep
{
    public const LENS_CUTTING = 'lens_cutting';
    public const FRAME_MOUNTING = 'frame_mounting';
    public const QC_INSPECTION = 'qc_inspection';
    public const PACKAGING = 'packaging';
    public const READY_TO_SHIP = 'ready_to_ship';

    public static function values(): array
    {
        return [
            self::LENS_CUTTING,
            self::FRAME_MOUNTING,
            self::QC_INSPECTION,
            self::PACKAGING,
            self::READY_TO_SHIP,
        ];
    }
}
