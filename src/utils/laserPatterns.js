// Beam pattern configs for each laser section.
// z = position along corridor, player starts at z=0 and moves toward z=corridorLength.
// Each beam sweeps perpendicular to the corridor (across width and/or height).

function makeBeam(id, z, opts = {}) {
  return {
    id,
    z,
    axis: opts.axis || 'x',        // 'x' = horizontal sweep, 'y' = vertical sweep
    pattern: opts.pattern || 'sweep', // 'sweep' | 'pulse' | 'static'
    speed: opts.speed || 1,
    phase: opts.phase || 0,         // offset for wave timing
    width: opts.width || 0.08,      // beam thickness
    range: opts.range || 3,         // sweep amplitude
    restY: opts.restY ?? 1,         // vertical position for horizontal beams
  }
}

export const CORRIDOR_LENGTH = { 1: 60, 2: 80, 3: 90 }

export function generateBeams(section) {
  switch (section) {
    case 1:
      return generateS1()
    case 2:
      return generateS2()
    case 3:
      return generateS3()
    default:
      return generateS1()
  }
}

// S1: Slow horizontal sweepers with wide gaps. Tutorial pace.
function generateS1() {
  const beams = []
  const spacing = 7
  for (let i = 0; i < 8; i++) {
    beams.push(
      makeBeam(`s1-${i}`, 8 + i * spacing, {
        axis: 'x',
        pattern: 'sweep',
        speed: 0.6 + Math.random() * 0.3,
        phase: i * 0.8,
        restY: 0.8 + (i % 3) * 0.4,
      })
    )
  }
  return beams
}

// S2: Bidirectional sweepers + pulsing beams. 40% faster.
function generateS2() {
  const beams = []
  const spacing = 5
  for (let i = 0; i < 12; i++) {
    const isPulse = i % 4 === 0
    beams.push(
      makeBeam(`s2-${i}`, 6 + i * spacing, {
        axis: i % 2 === 0 ? 'x' : 'y',
        pattern: isPulse ? 'pulse' : 'sweep',
        speed: (0.8 + Math.random() * 0.4) * 1.4,
        phase: i * 0.5,
        restY: 0.6 + (i % 3) * 0.5,
      })
    )
  }
  // Add a few counter-direction sweepers
  for (let i = 0; i < 4; i++) {
    beams.push(
      makeBeam(`s2-counter-${i}`, 15 + i * 16, {
        axis: 'x',
        pattern: 'sweep',
        speed: -(1.0 + Math.random() * 0.3) * 1.4,
        phase: i * 1.2,
        restY: 1.2,
      })
    )
  }
  return beams
}

// S3: Rapid-fire + pulsing, double speed.
function generateS3() {
  const beams = []
  const spacing = 4
  for (let i = 0; i < 18; i++) {
    const isPulse = i % 3 === 0
    beams.push(
      makeBeam(`s3-${i}`, 5 + i * spacing, {
        axis: i % 2 === 0 ? 'x' : 'y',
        pattern: isPulse ? 'pulse' : 'sweep',
        speed: (1.0 + Math.random() * 0.6) * 2,
        phase: i * 0.3,
        restY: 0.5 + (i % 4) * 0.35,
        range: 2.5 + Math.random(),
      })
    )
  }
  // Extra fast sweepers
  for (let i = 0; i < 5; i++) {
    beams.push(
      makeBeam(`s3-fast-${i}`, 10 + i * 15, {
        axis: 'x',
        pattern: 'sweep',
        speed: -(2.0 + Math.random()) * 2,
        phase: i,
        restY: 0.9,
        range: 3.5,
      })
    )
  }
  return beams
}
