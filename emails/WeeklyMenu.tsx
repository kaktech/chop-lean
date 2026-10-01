import { Button, EmailLayout, H1, P, SITE, naira } from "./Layout";

export type MenuEmailData = {
  weekOf: string;
  days: { day: string; meals: { name: string; kcal: number | null; slot: string }[] }[];
  plans: { name: string; kcal: number | null; priceKobo: number; slug: string }[];
};

const FULL: Record<string, string> = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday" };
const fmtWeek = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-NG", { day: "numeric", month: "long", timeZone: "UTC" });

export default function WeeklyMenu({ menu, unsubscribeUrl, welcome }: { menu: MenuEmailData; unsubscribeUrl: string; welcome?: boolean }) {
  return (
    <EmailLayout preview={`This week's Chop Lean menu: week of ${fmtWeek(menu.weekOf)}`}>
      <H1>{welcome ? "You're in. Here's this week's menu." : "This week's menu"}</H1>
      <P>{welcome ? "Thanks for subscribing. Every Sunday we'll send the new menu before it sells out. Here's the week of " : "The menu for the week of "}<b>{fmtWeek(menu.weekOf)}</b>. Orders for each delivery close at 6pm the day before (deliveries Mon, Wed and Fri).</P>
      {menu.days.map((d) => (
        <table key={d.day} width="100%" role="presentation" style={{ borderTop: "1px solid #E6E4DC", padding: "10px 0", margin: "0" }}>
          <tbody>
            <tr><td colSpan={2} style={{ fontWeight: 700, fontSize: 15, padding: "10px 0 2px" }}>{FULL[d.day]}</td></tr>
            {d.meals.map((m, i) => (
              <tr key={i}>
                <td style={{ fontSize: 14, color: "#3A4540", padding: "2px 0" }}><span style={{ color: "#3D6B1F", fontWeight: 700, textTransform: "capitalize" }}>{m.slot}</span> · {m.name}</td>
                <td align="right" style={{ fontSize: 13, color: "#5B6560", whiteSpace: "nowrap" }}>{m.kcal} kcal</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
      <P>&nbsp;</P>
      <P><b>Plans this week</b></P>
      {menu.plans.map((p) => (
        <table key={p.slug} width="100%" role="presentation"><tbody><tr>
          <td style={{ fontSize: 14, padding: "3px 0" }}><a href={`${SITE}/plans/${p.slug}`} style={{ color: "#15201A", fontWeight: 700, textDecoration: "none" }}>{p.name}</a> <span style={{ color: "#5B6560" }}>· {p.kcal} kcal/day</span></td>
          <td align="right" style={{ fontSize: 14, fontWeight: 700 }}>{naira(p.priceKobo)}<span style={{ fontWeight: 400, color: "#5B6560" }}> /wk</span></td>
        </tr></tbody></table>
      ))}
      <P>&nbsp;</P>
      <Button href={`${SITE}/menu`}>Order from the menu</Button>
      <P>&nbsp;</P>
      <P><span style={{ fontSize: 12, color: "#5B6560" }}>First order? Use code <b>CHOPLEAN20</b> for 20% off your first week of a plan. You&apos;re getting this because you subscribed to the Chop Lean weekly menu. <a href={unsubscribeUrl} style={{ color: "#5B6560" }}>Unsubscribe</a></span></P>
    </EmailLayout>
  );
}
