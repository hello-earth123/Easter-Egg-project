// low
import CastleWall from "../scenes/low/CastleWall";
import Road1 from "../scenes/low/Road1";
import Road2 from "../scenes/low/Road2";
import Road3 from "../scenes/low/Road3";
import Fountain from "../scenes/low/Fountain";
import MountainEntrance from "../scenes/low/MountainEntrance";
import DeeperMountain from "../scenes/low/DeeperMountain";
import SpookyMountain from "../scenes/low/SpookyMountain";

// mid
import CastleEntrance from "../scenes/mid/CastleEntrance";
import Cemetery1 from "../scenes/mid/Cemetery1";
import Cemetery2 from "../scenes/mid/Cemetery2";
import Cemetery3 from "../scenes/mid/Cemetery3";
import Cemetery4 from "../scenes/mid/Cemetery4";
import CemeteryEntrance from "../scenes/mid/CemeteryEntrance";
import CemeteryEndNorth from "../scenes/mid/CemeteryEndNorth";
import CemeteryEndWest from "../scenes/mid/CemeteryEndWest";

// high
import CastleLobby from "../scenes/high/CastleLobby";
import CastleInside from "../scenes/high/CastleInside";
import BanquetHall from "../scenes/high/BanquetHall";
import RitualRoom from "../scenes/high/RitualRoom";
import Hall1 from "../scenes/high/Hall1";
import Hall2 from "../scenes/high/Hall2";
import Valcony from "../scenes/high/Valcony";

// super
import Corridor1 from "../scenes/super/Corridor1";
import Corridor2 from "../scenes/super/Corridor2";
import Corridor3 from "../scenes/super/Corridor3";
import Threeway from "../scenes/super/Threeway";
import ThroneRoom from "../scenes/super/ThroneRoom";
import CenterEntrance from "../scenes/super/CenterEntrance";
import Center from "../scenes/super/Center";

import BossScene from "../scenes/BossScene";

export const sceneMap = {
  // low =======================
  CastleWall,
  Road1,
  Road2,
  Road3,
  Fountain,
  MountainEntrance,
  DeeperMountain,
  SpookyMountain,
  // ===========================


  // mid =======================
  CastleEntrance,
  Cemetery1,
  Cemetery2,
  Cemetery3,
  Cemetery4,
  CemeteryEntrance,
  CemeteryEndNorth,
  CemeteryEndWest,
  // ===========================


  // high ======================
  CastleLobby,
  CastleInside,
  BanquetHall,
  RitualRoom,
  Hall1,
  Hall2,
  Valcony,
  // ===========================


  // super =====================
  Corridor1,
  Corridor2,
  Corridor3,
  Threeway,
  ThroneRoom,
  CenterEntrance,
  Center,

  BossScene
};

export let currentScene = null;

export function setCurrentScene(scene){
    currentScene = scene;
}

export function getCurrentScene(scene){
    return currentScene;
}