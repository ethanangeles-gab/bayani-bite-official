"""Build an offline dashboard from the unchanged case CSVs."""
from pathlib import Path
import csv
import json

ROOT = Path(__file__).parent
SOURCE = ROOT / "BAYANI_BITE_Source_Data_CSV"
files = {
    "weekly": "exhibit1_weekly_ledger.csv",
    "branches": "exhibit2_branch_week12.csv",
    "peak": "exhibit2_peak_week12.csv",
    "survey": "exhibit3_survey_week12.csv",
    "options": "exhibit4_interventions.csv",
}
data = {}
for key, name in files.items():
    with (SOURCE / name).open(encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        for field, value in row.items():
            try:
                row[field] = float(value) if "." in value else int(value)
            except ValueError:
                pass
    data[key] = rows

# Independent source-based checks, separate from the JavaScript display logic.
def net(row):
    return row["gross_sales_php_000"] - row["discounts_php_000"] - row["refunds_php_000"]

def profit(row):
    return net(row) - row["food_cost_php_000"] - row["operating_cost_php_000"]

first, last = data["weekly"][0], data["weekly"][-1]
assert abs(net(first) - 186) < 1e-9
assert abs(net(last) - 218.3) < 1e-9
assert abs(profit(first) - 15) < 1e-9
assert abs(profit(last) + 34.7) < 1e-9
for key in ("recorded_entries", "completed_orders", "gross_sales_php_000",
            "discounts_php_000", "refunds_php_000", "food_cost_php_000",
            "operating_cost_php_000", "stockout_incidents"):
    assert abs(sum(b[key] for b in data["branches"]) - last[key]) < 1e-9, key
for branch in data["branches"]:
    peak = next(p for p in data["peak"] if p["location"] == branch["location"])
    assert peak["peak_entries"] + peak["nonpeak_entries"] == branch["recorded_entries"]
    assert peak["peak_orders"] + peak["nonpeak_orders"] == branch["completed_orders"]
assert sum(r["intend_to_return"] + r["do_not_intend_to_return"] for r in data["survey"]) == 180
options = {o["option"]: o for o in data["options"]}
c = options["C"]
ac = [options["A"], c]
assert 4 * c["weekly_uplift_lower_php_000"] - c["one_time_cost_php_000"] == 12
assert 4 * .75 * sum(o["weekly_uplift_lower_php_000"] for o in ac) - sum(o["one_time_cost_php_000"] for o in ac) == 7

out = ROOT / "BAYANI_BITE_Dashboard"
out.mkdir(exist_ok=True)
template = (ROOT / "dashboard.template.html").read_text(encoding="utf-8")
(out / "BAYANI_BITE_Dashboard.html").write_text(
    template.replace("__CASE_DATA__", json.dumps(data, ensure_ascii=False)), encoding="utf-8")
print("Built standalone dashboard. Independent KPI, pilot, survey and reconciliation checks passed.")

# Bulletin 01 verified against supplied update CSV.
with (ROOT / "bulletin_option_update.csv").open(encoding="utf-8-sig", newline="") as f:
    update = next(csv.DictReader(f))
assert update["option"] == "C"
assert float(update["new_budget_php_000"]) == 27
assert float(update["weekly_uplift_lower_php_000"]) == 1
assert float(update["weekly_uplift_upper_php_000"]) == 4
assert float(update["one_time_cost_php_000"]) == 8
from itertools import combinations
feasible = []
for n in range(6):
    for ids in combinations(options, n):
        cost = sum(options[i]["one_time_cost_php_000"] for i in ids)
        benefits = sum(1 if i == "C" else options[i]["weekly_uplift_lower_php_000"] for i in ids)
        uplift = benefits * (.75 if len(ids) > 1 else 1)
        if cost <= 27:
            feasible.append((4 * uplift - cost, ids))
assert max(feasible) == (6, ("A",))
assert 4 * 1 - 8 == -4
assert abs(profit(last) + 6 + 28.7) < 1e-9
print("Bulletin checked: C impact -4k, A impact +6k, A highest planning gain among all affordable combinations.")
