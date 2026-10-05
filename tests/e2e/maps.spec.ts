import { expect, test } from "@playwright/test";
import c1 from "../../src/data/case01.json" with { type: "json" };
import c2 from "../../src/data/case02.json" with { type: "json" };
import c3 from "../../src/data/case03.json" with { type: "json" };
import c4 from "../../src/data/case04.json" with { type: "json" };
import c5 from "../../src/data/case05.json" with { type: "json" };
import c6 from "../../src/data/case06.json" with { type: "json" };
import { start, noOverflow } from "../helpers/play";
for (const scenario of [c1,c2,c3,c4,c5,c6]) test(scenario.id+" smartphone network overview, labels, zoom and nodes",async ({page},info)=>{
  await start(page,scenario.id);
  for (const [width,height] of [[360,640],[390,844],[430,932]]) {
    await page.setViewportSize({width,height});
    await expect.poll(()=>page.evaluate(()=>{
      const map=document.querySelector(".map-overview")!.getBoundingClientRect();
      const actions=document.querySelector(".map-actions")!.getBoundingClientRect();
      const dock=document.querySelector(".game-dock")!.getBoundingClientRect();
      return map.top>=document.querySelector(".app-header")!.getBoundingClientRect().bottom && actions.bottom<=dock.top;
    })).toBe(true);
    await noOverflow(page);
    expect(await page.locator(".map-overview svg text").evaluateAll(nodes=>nodes.every(n=>{
      const svg=(n as SVGGraphicsElement).ownerSVGElement as SVGSVGElement; const b=(n as SVGGraphicsElement).getBBox();
      return b.x>=0 && b.y>=0 && b.x+b.width<=svg.viewBox.baseVal.width && b.y+b.height<=svg.viewBox.baseVal.height;
    }))).toBe(true);
    await expect(page.locator(".map-overview g[role=button]")).toHaveCount(scenario.topology.nodes.length);
    if(width===390)await page.screenshot({path:info.outputPath("overview-390.png")});
  }
  await page.getByRole("button",{name:"拡大して見る ↗",exact:true}).click();
  const dialog=page.getByRole("dialog",{name:"構成図を拡大",exact:true});
  await dialog.getByRole("button",{name:"構成図を拡大",exact:true}).click();
  await expect(dialog.getByText("175%",{exact:true})).toBeVisible();
  const region=dialog.getByRole("region",{name:"拡大構成図"});
  expect(await region.evaluate(e=>e.scrollWidth>e.clientWidth)).toBe(true);
  for(const node of scenario.topology.nodes){
    await dialog.getByRole("button",{name:node.label+"の詳細",exact:true}).click();
    await expect(dialog.getByRole("heading",{name:node.label,exact:true})).toBeVisible();
    for(const address of node.addresses)await expect(dialog.getByText(address,{exact:true}).last()).toBeVisible();
  }
  await dialog.getByRole("button",{name:"閉じる",exact:true}).last().click();
  await expect(page.locator(".map-overview")).toBeVisible();
});
