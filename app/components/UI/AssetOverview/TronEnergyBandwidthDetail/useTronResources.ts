import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectTronResourcesBySelectedAccountGroup } from '../../../../selectors/assets/assets-list';
import { TRON_RESOURCE } from '../../../../core/Multichain/constants';

export interface TronResource {
  type: 'energy' | 'bandwidth';
  current: number;
  max: number;
  /**
   * Percentage of the resource that is currently available, in the range 0–100.
   */
  percentage: number;
}

/**
 * Hook to build Tron daily resource data (energy and bandwidth) for the
 * currently selected account group.
 *
 * It normalizes raw Tron resource assets into a simple model consumable by
 * UI components. The max capacity is derived only from the base max values,
 * matching the behavior used in the extension codebase.
 */
export const useTronResources = (): {
  energy: TronResource;
  bandwidth: TronResource;
} => {
  const tronResources = useSelector(selectTronResourcesBySelectedAccountGroup);

  return useMemo(() => {
    let energy;
    let bandwidth;
    let maxEnergy;
    let maxBandwidth;

    // Extract the different Tron resource entries from the flat list.
    for (const asset of tronResources) {
      switch (asset.symbol?.toLowerCase()) {
        case TRON_RESOURCE.ENERGY:
          energy = asset;
          break;
        case TRON_RESOURCE.BANDWIDTH:
          bandwidth = asset;
          break;
        case TRON_RESOURCE.MAX_ENERGY:
          maxEnergy = asset;
          break;
        case TRON_RESOURCE.MAX_BANDWIDTH:
          maxBandwidth = asset;
          break;
        default:
          break;
      }
    }

    const parseNum = (v?: string | number) =>
      typeof v === 'number'
        ? v
        : parseFloat(String(v ?? '0').replace(/,/g, ''));

    const energyCurrent = parseNum(energy?.balance);
    const bandwidthCurrent = parseNum(bandwidth?.balance);
    const maxEnergyValue = parseNum(maxEnergy?.balance);
    const maxBandwidthValue = parseNum(maxBandwidth?.balance);

    const energyMax = Math.max(1, maxEnergyValue);
    const bandwidthMax = Math.max(1, maxBandwidthValue);

    const createResource = (
      type: TronResource['type'],
      current: number,
      max: number,
    ): TronResource => {
      const safeMax = max || 1;
      const percentage = (current / safeMax) * 100;

      return {
        type,
        current,
        max: safeMax,
        percentage: Number.isFinite(percentage)
          ? Math.max(0, Math.min(100, percentage))
          : 0,
      };
    };

    return {
      energy: createResource('energy', energyCurrent, energyMax),
      bandwidth: createResource('bandwidth', bandwidthCurrent, bandwidthMax),
    };
  }, [tronResources]);
};
