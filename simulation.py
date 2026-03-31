import random
import pandas as pd
import matplotlib.pyplot as plt

# --- Configuration & Constraints ---
NUM_LPS = 5             # 
NUM_TRADERS = 8         # 
N_TRANSACTIONS = 80     # N between 50 and 100 
FEE = 0.003             # 0.3% swap fee [cite: 55]

class DEXSimulation:
    def __init__(self):
        # Pool Reserves
        self.reserve_a = 10000.0
        self.reserve_b = 10000.0
        self.total_lpt = 100.0
        self.fees_collected_a = 0.0
        self.fees_collected_b = 0.0
        self.total_swap_volume_a = 0.0
        self.total_swap_volume_b = 0.0
        
        # Initialize Users
        self.lps = [{'id': i, 'token_a': 5000.0, 'token_b': 5000.0, 'lpt': 0.0} for i in range(NUM_LPS)]
        self.traders = [{'id': i, 'token_a': 2000.0, 'token_b': 2000.0} for i in range(NUM_TRADERS)]
        
        # Give initial LP tokens to LP 0 (simulating the creator)
        self.lps[0]['lpt'] = self.total_lpt
        
        # Metrics Tracking
        self.history = []

    def get_spot_price(self):
        # Spot price: TokenA / TokenB [cite: 71]
        return self.reserve_a / self.reserve_b

    def get_tvl(self):
        # TVL in TokenA units = Reserve A + (Reserve B * Spot Price) [cite: 71]
        return self.reserve_a + (self.reserve_b * self.get_spot_price())

    def add_liquidity(self, lp):
        # Random amount based on max tokens available 
        if lp['token_a'] <= 0: return
        
        amount_a = random.uniform(0.1, lp['token_a'])
        ratio = self.reserve_b / self.reserve_a
        amount_b = amount_a * ratio # Preserving the ratio [cite: 41, 42]
        
        if amount_b > lp['token_b']:
            amount_b = lp['token_b']
            amount_a = amount_b / ratio
            
        if amount_a <= 0 or amount_b <= 0: return

        # Mint LPT proportionally [cite: 45]
        lpt_minted = (amount_a / self.reserve_a) * self.total_lpt
        
        self.reserve_a += amount_a
        self.reserve_b += amount_b
        self.total_lpt += lpt_minted
        
        lp['token_a'] -= amount_a
        lp['token_b'] -= amount_b
        lp['lpt'] += lpt_minted

    def remove_liquidity(self, lp):
        # Random amount based on max LPT available 
        if lp['lpt'] <= 0: return
        
        lpt_amount = random.uniform(0.1, lp['lpt'])
        share = lpt_amount / self.total_lpt
        
        amount_a = share * self.reserve_a
        amount_b = share * self.reserve_b
        
        self.reserve_a -= amount_a
        self.reserve_b -= amount_b
        self.total_lpt -= lpt_amount
        
        lp['token_a'] += amount_a
        lp['token_b'] += amount_b
        lp['lpt'] -= lpt_amount

    def swap(self, trader, is_a_to_b):
        # Max swap is min(held, 10% of reserves) 
        if is_a_to_b:
            max_swap = min(trader['token_a'], self.reserve_a * 0.10)
            if max_swap <= 0: return 0
            amount_in = random.uniform(0.1, max_swap)
            
            fee = amount_in * FEE
            amount_in_with_fee = amount_in - fee
            self.fees_collected_a += fee
            
            # Constant product formula [cite: 51, 52]
            expected_price = self.reserve_b / self.reserve_a
            amount_out = (self.reserve_b * amount_in_with_fee) / (self.reserve_a + amount_in_with_fee)
            actual_price = amount_out / amount_in
            
            self.reserve_a += amount_in
            self.reserve_b -= amount_out
            trader['token_a'] -= amount_in
            trader['token_b'] += amount_out
            self.total_swap_volume_a += amount_in
            
        else:
            max_swap = min(trader['token_b'], self.reserve_b * 0.10)
            if max_swap <= 0: return 0
            amount_in = random.uniform(0.1, max_swap)
            
            fee = amount_in * FEE
            amount_in_with_fee = amount_in - fee
            self.fees_collected_b += fee
            
            expected_price = self.reserve_a / self.reserve_b
            amount_out = (self.reserve_a * amount_in_with_fee) / (self.reserve_b + amount_in_with_fee)
            actual_price = amount_out / amount_in
            
            self.reserve_b += amount_in
            self.reserve_a -= amount_out
            trader['token_b'] -= amount_in
            trader['token_a'] += amount_out
            self.total_swap_volume_b += amount_in

        # Slippage Calculation [cite: 73, 74]
        slippage = ((expected_price - actual_price) / expected_price) * 100 
        return slippage

    def run(self):
        self.record_metrics(0, 0) # Initial state
        
        for i in range(1, N_TRANSACTIONS + 1):
            # Choose performer uniformly randomly [cite: 67]
            user_type = random.choice(['LP', 'Trader'])
            slippage = 0
            
            if user_type == 'LP':
                lp = random.choice(self.lps)
                action = random.choice(['add', 'remove'])
                if action == 'add':
                    self.add_liquidity(lp)
                else:
                    self.remove_liquidity(lp)
            else:
                trader = random.choice(self.traders)
                is_a_to_b = random.choice([True, False])
                slippage = self.swap(trader, is_a_to_b)
                
            self.record_metrics(i, slippage)

    def record_metrics(self, tx_id, slippage):
        # Calculate fee accumulation in TokenA value
        total_fees_in_a = self.fees_collected_a + (self.fees_collected_b * self.get_spot_price())
        
        self.history.append({
            'Transaction': tx_id,
            'TVL': self.get_tvl(),
            'Reserve Ratio (A/B)': self.reserve_a / self.reserve_b,
            'Total Swap Volume A': self.total_swap_volume_a,
            'Total Swap Volume B': self.total_swap_volume_b,
            'Total Fees (in TokenA)': total_fees_in_a,
            'Spot Price (A/B)': self.get_spot_price(),
            'Slippage (%)': max(0, slippage)
        })

    def plot_results(self):
        df = pd.DataFrame(self.history)
        
        fig, axs = plt.subplots(3, 2, figsize=(15, 12))
        fig.suptitle(f'DEX Simulation Metrics over {N_TRANSACTIONS} Transactions', fontsize=16)

        # 1. TVL
        axs[0, 0].plot(df['Transaction'], df['TVL'], color='blue')
        axs[0, 0].set_title('Total Value Locked (in TokenA units)')
        axs[0, 0].set_ylabel('TVL')

        # 2. Reserve Ratio & Spot Price
        axs[0, 1].plot(df['Transaction'], df['Reserve Ratio (A/B)'], label='Reserve Ratio', color='green')
        axs[0, 1].plot(df['Transaction'], df['Spot Price (A/B)'], label='Spot Price', color='orange', linestyle='--')
        axs[0, 1].set_title('Reserve Ratio & Spot Price')
        axs[0, 1].legend()

        # 3. Cumulative Swap Volume
        axs[1, 0].plot(df['Transaction'], df['Total Swap Volume A'], label='Token A Volume')
        axs[1, 0].plot(df['Transaction'], df['Total Swap Volume B'], label='Token B Volume')
        axs[1, 0].set_title('Cumulative Swap Volume')
        axs[1, 0].legend()

        # 4. Fee Accumulation
        axs[1, 1].plot(df['Transaction'], df['Total Fees (in TokenA)'], color='purple')
        axs[1, 1].set_title('Fee Accumulation (Converted to TokenA)')
        
        # 5. Slippage per transaction
        # Filter out 0 slippage (which represent LP deposits/withdrawals) for a cleaner plot
        swaps_only = df[df['Slippage (%)'] > 0]
        axs[2, 0].scatter(swaps_only['Transaction'], swaps_only['Slippage (%)'], color='red', alpha=0.6)
        axs[2, 0].set_title('Swap Slippage (%)')
        axs[2, 0].set_xlabel('Transaction #')
        axs[2, 0].set_ylabel('Slippage %')

        # 6. LP Distribution (Pie Chart at the end of simulation)
        lp_holdings = [lp['lpt'] for lp in self.lps]
        axs[2, 1].pie(lp_holdings, labels=[f'LP {i}' for i in range(NUM_LPS)], autopct='%1.1f%%')
        axs[2, 1].set_title('Final LP Token Distribution')

        plt.tight_layout()
        plt.show()

if __name__ == "__main__":
    sim = DEXSimulation()
    sim.run()
    sim.plot_results()