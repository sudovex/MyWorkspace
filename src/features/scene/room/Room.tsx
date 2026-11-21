'use client';

/**
 * Assembles the full room. Composition only — every object owns its own
 * geometry, textures and hover response; `layout.ts` owns where things sit.
 */
import { RoomShell } from './RoomShell';
import { Desk } from './objects/Desk';
import { Monitor } from './objects/Monitor';
import { Keyboard } from './objects/Keyboard';
import { Lamp } from './objects/Lamp';
import { Helmet } from './objects/Helmet';
import { Calendar } from './objects/Calendar';
import { Shelf } from './objects/Shelf';
import { DeskProps } from './objects/DeskProps';
import { Furniture } from './objects/Furniture';
import { WallDecor } from './objects/WallDecor';
import { Certificate } from './objects/Certificate';
import { Headphones } from './objects/Headphones';
import { Soundbar } from './objects/Soundbar';
import { Shaker } from './objects/Shaker';
import { Beacons } from './objects/Beacons';
import { Dust } from './objects/Dust';

interface RoomProps {
  shadowMapSize: number;
}

export function Room({ shadowMapSize }: RoomProps) {
  return (
    <group name="room">
      <RoomShell />
      <WallDecor />
      <Certificate />
      <Desk />
      <Monitor />
      <Soundbar />
      <Keyboard />
      <Lamp shadowMapSize={shadowMapSize} />
      <Helmet />
      <Calendar />
      <Shaker />
      <Shelf />
      <DeskProps />
      <Headphones />
      <Furniture />
      <Dust />
      <Beacons />
    </group>
  );
}
