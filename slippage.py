import numpy as np
import matplotlib.pyplot as plt

# Define the trade lot fraction 'f' (e.g., from 0 to 2, representing 0% to 200% of the pool)
f = np.linspace(0, 2, 200)

# Calculate Slippage 'S' using the derived formula: S = f / (1 + f)
S = f / (1 + f)

# Convert to percentages for better readability on the plot
f_percent = f * 100
S_percent = S * 100

# Create the plot
plt.figure(figsize=(9, 6))
plt.plot(f_percent, S_percent, label=r'Slippage $S = \frac{f}{1+f}$', color='#e0533c', linewidth=2.5)

# Highlight a few key data points
key_f = np.array([0.1, 0.5, 1.0]) 
key_S = key_f / (1 + key_f)
plt.scatter(key_f * 100, key_S * 100, color='black', zorder=5)
for k_f, k_s in zip(key_f, key_S):
    plt.annotate(f'f={k_f*100:.0f}%, S={k_s*100:.1f}%', 
                 (k_f * 100, k_s * 100), 
                 textcoords="offset points", 
                 xytext=(-10, 10), ha='center')

# Formatting the plot
plt.title('Slippage vs. Trade Lot Fraction in a Constant Product AMM', fontsize=14)
plt.xlabel('Trade Lot Fraction ($f$) as % of Token X Reserves', fontsize=12)
plt.ylabel('Slippage ($S$) %', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.legend(fontsize=12)

# Show the plot
plt.tight_layout()
plt.show()