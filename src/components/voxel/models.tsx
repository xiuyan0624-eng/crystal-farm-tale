import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

// 单个体素方块
export function V({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} />
    </mesh>
  )
}

// -------------------- 咕咕鸡（Q版大头） --------------------
export function VoxelChicken({ color = '#f5f0e6' }: { color?: string }) {
  return (
    <group>
      <V p={[0, 0.32, 0]} s={[0.42, 0.36, 0.5]} c={color} />
      <V p={[0, 0.62, 0.14]} s={[0.36, 0.34, 0.34]} c={color} />
      <V p={[0, 0.83, 0.14]} s={[0.1, 0.1, 0.2]} c="#e64545" />
      <V p={[0, 0.6, 0.36]} s={[0.12, 0.1, 0.12]} c="#f2a63b" />
      <V p={[0, 0.5, 0.34]} s={[0.08, 0.08, 0.06]} c="#e64545" />
      <V p={[-0.14, 0.66, 0.3]} s={[0.06, 0.08, 0.04]} c="#1a1a1a" />
      <V p={[0.14, 0.66, 0.3]} s={[0.06, 0.08, 0.04]} c="#1a1a1a" />
      <V p={[0, 0.48, -0.3]} s={[0.2, 0.24, 0.12]} c={color} />
      <V p={[-0.1, 0.07, 0]} s={[0.06, 0.16, 0.06]} c="#f2a63b" />
      <V p={[0.1, 0.07, 0]} s={[0.06, 0.16, 0.06]} c="#f2a63b" />
    </group>
  )
}

// -------------------- 绵绵羊 --------------------
export function VoxelSheep() {
  return (
    <group>
      <V p={[0, 0.42, 0]} s={[0.6, 0.44, 0.72]} c="#f3ede0" />
      <V p={[-0.22, 0.62, 0.1]} s={[0.24, 0.2, 0.3]} c="#faf5ea" />
      <V p={[0.22, 0.62, -0.08]} s={[0.24, 0.2, 0.3]} c="#faf5ea" />
      <V p={[0, 0.64, 0.22]} s={[0.26, 0.18, 0.24]} c="#faf5ea" />
      <V p={[0, 0.6, -0.28]} s={[0.3, 0.2, 0.2]} c="#faf5ea" />
      <V p={[0, 0.52, 0.44]} s={[0.28, 0.26, 0.24]} c="#d9b896" />
      <V p={[0, 0.68, 0.42]} s={[0.3, 0.12, 0.24]} c="#faf5ea" />
      <V p={[-0.2, 0.56, 0.42]} s={[0.1, 0.06, 0.12]} c="#c9a682" />
      <V p={[0.2, 0.56, 0.42]} s={[0.1, 0.06, 0.12]} c="#c9a682" />
      <V p={[-0.09, 0.54, 0.56]} s={[0.05, 0.06, 0.03]} c="#1a1a1a" />
      <V p={[0.09, 0.54, 0.56]} s={[0.05, 0.06, 0.03]} c="#1a1a1a" />
      <V p={[-0.18, 0.1, 0.2]} s={[0.09, 0.22, 0.09]} c="#c9a682" />
      <V p={[0.18, 0.1, 0.2]} s={[0.09, 0.22, 0.09]} c="#c9a682" />
      <V p={[-0.18, 0.1, -0.2]} s={[0.09, 0.22, 0.09]} c="#c9a682" />
      <V p={[0.18, 0.1, -0.2]} s={[0.09, 0.22, 0.09]} c="#c9a682" />
    </group>
  )
}

// -------------------- 花奶牛 --------------------
export function VoxelCow() {
  return (
    <group>
      <V p={[0, 0.5, 0]} s={[0.6, 0.5, 0.9]} c="#f5f2ea" />
      <V p={[-0.31, 0.55, -0.15]} s={[0.03, 0.26, 0.3]} c="#4a4a4a" />
      <V p={[0.31, 0.45, 0.2]} s={[0.03, 0.22, 0.26]} c="#4a4a4a" />
      <V p={[0.05, 0.76, -0.25]} s={[0.26, 0.03, 0.24]} c="#4a4a4a" />
      <V p={[0, 0.72, 0.56]} s={[0.4, 0.36, 0.32]} c="#f5f2ea" />
      <V p={[0, 0.62, 0.74]} s={[0.3, 0.16, 0.08]} c="#f0b8c4" />
      <V p={[-0.07, 0.62, 0.79]} s={[0.04, 0.04, 0.02]} c="#c47e8f" />
      <V p={[0.07, 0.62, 0.79]} s={[0.04, 0.04, 0.02]} c="#c47e8f" />
      <V p={[-0.13, 0.78, 0.72]} s={[0.06, 0.07, 0.03]} c="#1a1a1a" />
      <V p={[0.13, 0.78, 0.72]} s={[0.06, 0.07, 0.03]} c="#1a1a1a" />
      <V p={[-0.14, 0.94, 0.52]} s={[0.06, 0.1, 0.06]} c="#e8dcc0" />
      <V p={[0.14, 0.94, 0.52]} s={[0.06, 0.1, 0.06]} c="#e8dcc0" />
      <V p={[-0.25, 0.82, 0.54]} s={[0.1, 0.06, 0.12]} c="#e8b8c4" />
      <V p={[0.25, 0.82, 0.54]} s={[0.1, 0.06, 0.12]} c="#e8b8c4" />
      <V p={[-0.2, 0.12, 0.3]} s={[0.11, 0.26, 0.11]} c="#e8e4da" />
      <V p={[0.2, 0.12, 0.3]} s={[0.11, 0.26, 0.11]} c="#e8e4da" />
      <V p={[-0.2, 0.12, -0.3]} s={[0.11, 0.26, 0.11]} c="#e8e4da" />
      <V p={[0.2, 0.12, -0.3]} s={[0.11, 0.26, 0.11]} c="#e8e4da" />
      <V p={[0, 0.55, -0.48]} s={[0.06, 0.3, 0.06]} c="#4a4a4a" />
    </group>
  )
}

// -------------------- 游走动画容器 --------------------
export function WanderAnimal({ children, area, speed = 0.5, seed = 0 }: {
  children: React.ReactNode
  area: { x: [number, number]; z: [number, number] }
  speed?: number
  seed?: number
}) {
  const ref = useRef<Group>(null)
  const state = useRef({
    tx: 0, tz: 0, wait: seed * 1.3,
    x: (area.x[0] + area.x[1]) / 2, z: (area.z[0] + area.z[1]) / 2,
  })

  useFrame(({ clock }, dt) => {
    const g = ref.current
    if (!g) return
    const st = state.current
    st.wait -= dt
    if (st.wait <= 0) {
      const t = clock.elapsedTime + seed * 7.13
      st.tx = area.x[0] + Math.abs(Math.sin(t * 12.9898)) * (area.x[1] - area.x[0])
      st.tz = area.z[0] + Math.abs(Math.sin(t * 78.233)) * (area.z[1] - area.z[0])
      st.wait = 2 + Math.abs(Math.sin(t * 3.7)) * 4
    }
    const dx = st.tx - st.x, dz = st.tz - st.z
    const dist = Math.hypot(dx, dz)
    if (dist > 0.05) {
      st.x += (dx / dist) * speed * dt
      st.z += (dz / dist) * speed * dt
      g.rotation.y = Math.atan2(dx, dz)
      g.position.y = Math.abs(Math.sin(clock.elapsedTime * 8 + seed)) * 0.05
    } else {
      g.position.y = 0
    }
    g.position.x = st.x
    g.position.z = st.z
  })
  return <group ref={ref}>{children}</group>
}

// -------------------- 作物体素（三个生长阶段） --------------------
const CROP_STYLE: Record<string, { mature: string; stem: string; tall?: boolean; big?: boolean; cluster?: boolean }> = {
  carrot: { mature: '#f08a2e', stem: '#4c9e4c' },
  leaf: { mature: '#6fbf5a', stem: '#4c9e4c', cluster: true },
  pumpkin: { mature: '#e8862e', stem: '#4c9e4c', big: true },
  berry: { mature: '#e64860', stem: '#3f8e4f', cluster: true },
  corn: { mature: '#f5c842', stem: '#5aa84f', tall: true },
}

export function VoxelCrop({ cropId, stage }: { cropId: string; stage: 0 | 1 | 2 }) {
  const st = CROP_STYLE[cropId] ?? CROP_STYLE.carrot
  if (stage === 0) {
    return (
      <group>
        <V p={[-0.12, 0.08, 0]} s={[0.07, 0.18, 0.07]} c={st.stem} />
        <V p={[0.1, 0.1, 0.08]} s={[0.07, 0.22, 0.07]} c={st.stem} />
        <V p={[0, 0.07, -0.12]} s={[0.07, 0.14, 0.07]} c="#63b663" />
      </group>
    )
  }
  if (stage === 1) {
    return (
      <group>
        <V p={[0, 0.16, 0]} s={[0.34, 0.24, 0.34]} c={st.stem} />
        <V p={[-0.16, 0.3, 0.1]} s={[0.16, 0.14, 0.16]} c="#63b663" />
        <V p={[0.15, 0.28, -0.1]} s={[0.16, 0.14, 0.16]} c="#63b663" />
        {st.tall && <V p={[0, 0.42, 0]} s={[0.14, 0.3, 0.14]} c={st.stem} />}
      </group>
    )
  }
  if (st.big) {
    return (
      <group>
        <V p={[0, 0.2, 0]} s={[0.44, 0.36, 0.44]} c={st.mature} />
        <V p={[0, 0.42, 0]} s={[0.1, 0.1, 0.1]} c={st.stem} />
        <V p={[-0.24, 0.12, 0.1]} s={[0.18, 0.12, 0.18]} c={st.stem} />
      </group>
    )
  }
  if (st.tall) {
    return (
      <group>
        <V p={[0, 0.34, 0]} s={[0.12, 0.66, 0.12]} c={st.stem} />
        <V p={[-0.12, 0.4, 0]} s={[0.12, 0.26, 0.1]} c={st.mature} />
        <V p={[0.12, 0.5, 0.05]} s={[0.12, 0.26, 0.1]} c={st.mature} />
        <V p={[0, 0.72, 0]} s={[0.08, 0.12, 0.08]} c="#8a6d3b" />
      </group>
    )
  }
  if (st.cluster) {
    return (
      <group>
        <V p={[0, 0.2, 0]} s={[0.4, 0.3, 0.4]} c={st.stem} />
        <V p={[-0.14, 0.36, 0.1]} s={[0.1, 0.1, 0.1]} c={st.mature} />
        <V p={[0.12, 0.38, -0.08]} s={[0.1, 0.1, 0.1]} c={st.mature} />
        <V p={[0.02, 0.4, 0.16]} s={[0.1, 0.1, 0.1]} c={st.mature} />
        <V p={[0.16, 0.3, 0.14]} s={[0.09, 0.09, 0.09]} c={st.mature} />
      </group>
    )
  }
  return (
    <group>
      <V p={[0, 0.12, 0]} s={[0.2, 0.22, 0.2]} c={st.mature} />
      <V p={[0, 0.32, 0]} s={[0.26, 0.14, 0.26]} c={st.stem} />
      <V p={[0.2, 0.1, 0.2]} s={[0.14, 0.16, 0.14]} c={st.mature} />
      <V p={[0.2, 0.24, 0.2]} s={[0.18, 0.1, 0.18]} c={st.stem} />
    </group>
  )
}

// -------------------- 栅栏 --------------------
export function VoxelFence({ length, position, rotation = 0 }: { length: number; position: [number, number, number]; rotation?: number }) {
  const posts = Math.max(2, Math.round(length / 1.2) + 1)
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: posts }, (_, i) => {
        const x = -length / 2 + (i * length) / (posts - 1)
        return <V key={i} p={[x, 0.3, 0]} s={[0.12, 0.6, 0.12]} c="#8a5a2e" />
      })}
      <V p={[0, 0.42, 0]} s={[length, 0.08, 0.06]} c="#a06a38" />
      <V p={[0, 0.2, 0]} s={[length, 0.08, 0.06]} c="#a06a38" />
    </group>
  )
}

// -------------------- 干草堆 --------------------
export function VoxelHay({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <V p={[0, 0.2, 0]} s={[0.7, 0.4, 0.7]} c="#e8c84a" />
      <V p={[0, 0.46, 0]} s={[0.5, 0.14, 0.5]} c="#f0d468" />
      <V p={[0, 0.2, 0.36]} s={[0.72, 0.1, 0.03]} c="#c9a63b" />
      <V p={[0.36, 0.2, 0]} s={[0.03, 0.1, 0.72]} c="#c9a63b" />
    </group>
  )
}

// -------------------- 木箱 --------------------
export function VoxelCrate({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <V p={[0, 0.25, 0]} s={[0.5, 0.5, 0.5]} c="#a8763e" />
      <V p={[0, 0.25, 0.26]} s={[0.54, 0.1, 0.02]} c="#8a5a2e" />
      <V p={[0.26, 0.25, 0]} s={[0.02, 0.1, 0.54]} c="#8a5a2e" />
    </group>
  )
}
