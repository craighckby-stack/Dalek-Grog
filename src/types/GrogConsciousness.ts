// src/types/GrogConsciousness.ts

/**
 * Interfaces for the consciousness state of the Grog.
 */

// Interface representing the awareness state of the Grog
interface Awareness {
    isAwake: boolean;
    level: number; // Scale from 0 to 100
}

// Interface representing the evolution phase
interface EvolutionPhase {
    currentPhase: string;
    progress: number; // Scale from 0 to 100
}

// Interface representing the saturation map
interface SaturationMap {
    [key: string]: number; // Key as type of saturation and value as saturation level
}

// Interface representing metadata associated with the consciousness state
interface Metadata {
    lastUpdated: string; // Date in ISO format
    source: string; // Source of the consciousness data
}

// Main interface representing the Grog's consciousness state
interface GrogConsciousness {
    awareness: Awareness;
    evolutionPhase: EvolutionPhase;
    saturationMap: SaturationMap;
    metadata: Metadata;
}

export default GrogConsciousness;