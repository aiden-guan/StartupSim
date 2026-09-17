import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { cofounders } from "../data/cofounders";
import { useCameraDirector, TITLE_SHOT, PREVIEW_SHOT, overviewShot } from "./camera/cameraStore";
import { CameraDirector } from "./camera/CameraDirector";
import { Character } from "./characters/Character";
import { Apartment } from "./environments/Apartment";
import { OfficeLighting } from "./environments/Lighting";
import { CampusOffice, GarageOffice, HQOffice, MegaCampus, ResearchLab } from "./environments/Offices";
import { layoutFor } from "./navigation/layout";
import { occupancyReset } from "./navigation/occupancy";
import { DepartingAgent, EmployeeAgent } from "./navigation/Agent";
import { selectWorldView } from "./selectWorldView";
import { useGame } from "../state/store";
import { DEFAULT_BRAND } from "../simulation/newGame";
import { CrowdSilhouettes } from "./props/Crowd";

function Scene() {
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const setup = useGame((s) => s.setup);
  const selectEmployee = useGame((s) => s.selectEmployee);
  const selectObject = useGame((s) => s.selectObject);
  const setDrawer = useGame((s) => s.setDrawer);
  const departures = useGame((s) => s.departures);
  const view = useMemo(() => (game ? selectWorldView(game) : null), [game]);
  const level = view?.officeLevel ?? 0;
  const layout = layoutFor(level);
  const reduced = Boolean(game?.settings.reducedMotion);
  const quality = game?.settings.graphics ?? "high";
  const standing = Boolean(game?.company.perks.some((p) => p.id === "desks"));
  const brand = view?.brand ?? setup.brand ?? DEFAULT_BRAND;
  const empty = (view?.automation ?? 0) > 55;
  const emptyDesks = empty || (view ? view.agents.length < 4 && level >= 2 : false);

  useEffect(() => {
    occupancyReset();
  }, [level]);

  useEffect(() => {
    const cam = useCameraDirector.getState();
    if (screen === "title") cam.setGoal(TITLE_SHOT);
    else if (screen === "setup") cam.setGoal(PREVIEW_SHOT);
    else {
      const shot = overviewShot(level);
      cam.overview(level);
      cam.setGoal({ ...shot, mode: "PLAYER" });
    }
  }, [screen, level]);

  const onObject = (id: string) => {
    selectObject(id);
    const map: Record<string, "perks" | "tasks" | "company" | "compute" | "research" | "hiring"> = {
      coffee: "perks",
      board: "tasks",
      plant: "company",
      logo: "company",
      founderDesk: "company",
      servers: "compute",
      lab: "research",
      reception: "hiring",
    };
    const drawer = map[id];
    if (drawer) setDrawer(drawer);
  };

  const office =
    level <= 0 ? (
      <Apartment onObject={onObject} perks={view?.perks ?? []} brand={brand} standingDesks={standing} />
    ) : level === 1 ? (
      <GarageOffice onObject={onObject} perks={view?.perks ?? []} brand={brand} computeLoad={view?.computeLoad} />
    ) : level === 2 ? (
      <HQOffice onObject={onObject} perks={view?.perks ?? []} brand={brand} computeLoad={view?.computeLoad} emptyDesks={emptyDesks} />
    ) : level === 3 ? (
      <ResearchLab onObject={onObject} perks={view?.perks ?? []} brand={brand} computeLoad={view?.computeLoad} empty={empty} />
    ) : level === 4 ? (
      <CampusOffice onObject={onObject} perks={view?.perks ?? []} brand={brand} computeLoad={view?.computeLoad} empty={empty} />
    ) : (
      <MegaCampus onObject={onObject} perks={view?.perks ?? []} brand={brand} computeLoad={view?.computeLoad} />
    );

  const cofounder = cofounders.find((c) => c.id === setup.cofounderId) ?? cofounders[0]!;

  return (
    <>
      <OfficeLighting level={screen === "playing" ? level : 0} quality={quality} />
      <CameraDirector reducedMotion={reduced} minDistance={layout.camera.min} maxDistance={layout.camera.max} />
      {screen === "setup" && setup.step === "founder" ? (
        <group position={[0, 0, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[2.2, 32]} />
            <meshStandardMaterial color="#cbb59a" />
          </mesh>
          <Character look={setup.founderLook} activity="idle" preview />
        </group>
      ) : null}
      {screen === "setup" && setup.step === "cofounder" ? (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.2, 32]} />
            <meshStandardMaterial color="#cbb59a" />
          </mesh>
          <Character look={cofounder.look} activity="idle" preview />
        </group>
      ) : null}
      {screen === "setup" && setup.step === "company" ? (
        <group>
          <Apartment onObject={() => undefined} perks={[]} brand={setup.brand} />
        </group>
      ) : null}
      {screen === "title" || (screen === "playing" && view) ? office : null}
      {screen === "title" ? (
        <>
          <group position={[-2.35, 0, -1.35]}>
            <Character look={setup.founderLook} activity="working" />
          </group>
          <group position={[2.05, 0, -1.4]}>
            <Character look={cofounder.look} activity="working" />
          </group>
        </>
      ) : null}
      {screen === "playing" && view
        ? view.agents.map((agent, index) => (
            <EmployeeAgent
              key={agent.id}
              agent={agent}
              layout={layout}
              index={index}
              reducedMotion={reduced}
              onSelect={selectEmployee}
            />
          ))
        : null}
      {screen === "playing" && view
        ? departures.map((d) => <DepartingAgent key={d.id} look={d.look} robot={d.robot} layout={layout} id={d.id} />)
        : null}
      {screen === "playing" && view && view.hiddenCount > 0 && quality !== "low" ? (
        <CrowdSilhouettes count={view.hiddenCount} layout={layout} cool={level >= 3} />
      ) : null}
    </>
  );
}

export function WorldCanvas() {
  const quality = useGame((s) => s.game?.settings.graphics ?? "high");
  const dpr = quality === "low" ? 1 : quality === "medium" ? ([1, 1.5] as [number, number]) : ([1, 2] as [number, number]);
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows={quality !== "low"}
        dpr={dpr}
        camera={{ position: [-3.6, 6.4, 4.1], fov: 42 }}
        gl={{ antialias: quality !== "low", powerPreference: quality === "high" ? "high-performance" : "default" }}
        className="h-full w-full"
      >
        <Scene />
      </Canvas>
    </div>
  );
}
