import matplotlib.pyplot as plt
import pandas as pd
from io import BytesIO

def RespiratoryPlotter(data: pd.DataFrame, fs: int = 200) -> BytesIO:
    if data.empty:
        raise ValueError("Input DataFrame is empty and cannot be plotted.")
        
    ts = 1 / fs
    time = data.index * ts

    fig, ax = plt.subplots(figsize=(15, 5))

    color_r5 = 'tab:blue'
    color_x5 = 'tab:green'
    color_vol = 'tab:red'

    ax.set_xlabel('Time (s)')
    ax.set_ylabel('Value')

    l1, = ax.plot(time, data['R5'], color=color_r5, label='R5')
    l2, = ax.plot(time, data['X5'], color=color_x5, label='X5')
    l3, = ax.plot(time, data['Volume'], color=color_vol, label='Volume')

    ax.legend(handles=[l1, l2, l3], loc='upper left')
    plt.title('R5, X5 and Volume vs Time')
    fig.tight_layout()
    plt.grid()

    buffer = BytesIO()
    plt.savefig(buffer, format='png', dpi=300, bbox_inches='tight')
    buffer.seek(0)
    plt.close(fig)

    return buffer

