"""LinkPulse report charts — Crystal Blue palette (Template 07 family).
Chart 1: TAM/SAM/SOM horizontal bars (indicative)
Chart 2: Year-3 indicative revenue mix donut
Follows typesetting/charts.md: no top/right spines, dashed grid 20% (or none
when values labeled), donut hole 0.65, frameless legend, no chart-internal
title (captions live in the PDF body).
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# Crystal Blue family (single hue ~215 deg)
ACCENT   = "#2d7ab3"   # XS accent
LUMEN    = "#4da8da"   # luminous blue
DEEP     = "#1a4a7a"   # M tier header fill
MUTED    = "#5a7a96"   # muted text
BORDER   = "#c0d0e2"   # S tier border
TEXT     = "#142840"   # primary text
PAGE_BG  = "#ffffff"   # white chart background (body page is light blue-white)

plt.rcParams["font.family"] = "DejaVu Sans"
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["text.color"] = TEXT
plt.rcParams["axes.labelcolor"] = MUTED
plt.rcParams["xtick.color"] = MUTED
plt.rcParams["ytick.color"] = TEXT

OUT = "/home/z/my-project/scripts/assets"

# ---------------------------------------------------------------- Chart 1
fig, ax = plt.subplots(figsize=(7.6, 3.4), dpi=200, constrained_layout=True)
fig.patch.set_facecolor(PAGE_BG)
ax.set_facecolor(PAGE_BG)

stages = ["TAM\nEA internet connections\n(mobile + fixed, indicative)",
          "SAM\nSmartphone users who pay\nfor data (indicative)",
          "SOM\nYear-3 active users target\n(LinkPulse)"]
vals  = [110, 40, 1.8]
labs  = ["~110M", "~40M", "1.5-2.0M"]
colors = [BORDER, LUMEN, ACCENT]

bars = ax.barh(stages, vals, color=colors, height=0.52, edgecolor="none")
ax.invert_yaxis()

for b, lab in zip(bars, labs):
    ax.text(b.get_width() + 2.0, b.get_y() + b.get_height() / 2, lab,
            va="center", ha="left", fontsize=11, fontweight="bold", color=TEXT)

ax.set_xlim(0, 128)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.spines["left"].set_visible(False)
ax.spines["bottom"].set_color(BORDER)
ax.tick_params(axis="y", length=0, labelsize=9)
ax.tick_params(axis="x", labelsize=9)
ax.set_xlabel("Millions of users / connections", fontsize=9)
ax.grid(False)

fig.savefig(f"{OUT}/chart_tamsamsom.png", facecolor=PAGE_BG)
plt.close(fig)

# ---------------------------------------------------------------- Chart 2
fig, ax = plt.subplots(figsize=(7.2, 3.6), dpi=200, constrained_layout=True)
fig.patch.set_facecolor(PAGE_BG)

mix_labels = ["Consumer Pro subscriptions", "Bundle & top-up commissions",
              "SME monitoring SaaS", "Anonymized QoS insights & other"]
mix_vals = [35, 30, 25, 10]
mix_cols = [DEEP, ACCENT, LUMEN, BORDER]

wedges, _ = ax.pie(
    mix_vals, colors=mix_cols, startangle=90, counterclock=False,
    wedgeprops=dict(width=0.35, edgecolor=PAGE_BG, linewidth=2))
ax.set(aspect="equal")
ax.text(0, 0.06, "Year 3", ha="center", va="center",
        fontsize=15, fontweight="bold", color=TEXT)
ax.text(0, -0.16, "revenue mix", ha="center", va="center",
        fontsize=9, color=MUTED)

# Strategy C: rich legend, frameless, outside the donut (right side)
legend_labels = [f"{l}  —  {v}%" for l, v in zip(mix_labels, mix_vals)]
leg = ax.legend(wedges, legend_labels, loc="center left",
                bbox_to_anchor=(1.02, 0.5), frameon=False,
                fontsize=9.5, handlelength=0.9, handleheight=0.9,
                labelspacing=1.1, borderaxespad=0)
for t in leg.get_texts():
    t.set_color(TEXT)

fig.savefig(f"{OUT}/chart_revmix.png", facecolor=PAGE_BG)
plt.close(fig)

print("charts done")
