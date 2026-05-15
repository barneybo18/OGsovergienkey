import os

path = r'c:\Users\PR1M3\Desktop\SAK-Phase2\mission-control\src\app\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if 'value={lastProvingTime}' in line:
        new_lines.append(line.replace('value={lastProvingTime}', 'value={networkData?.zkStats?.lastProvingTime ? `${networkData.zkStats.lastProvingTime}s` : lastProvingTime}'))
    elif 'label="Duration"' in line:
        new_lines.append(line.replace('label="Duration"', 'label="Last Proof"'))
    elif 'trend="Groth16 (snarkjs / circom 2.0)"' in line:
        new_lines.append(line.replace('trend="Groth16 (snarkjs / circom 2.0)"', 
            'trend={networkData?.zkStats?.status || "Groth16 (snarkjs)"} trendColor={!networkData?.zkStats?.lastProvingTime ? "text-brand-cyan/80" : networkData.zkStats.lastProvingTime < 45 ? "text-green-400" : networkData.zkStats.lastProvingTime < 90 ? "text-yellow-400" : "text-red-400"} history={networkData?.zkStats?.history}'))
    elif 'const data = await res.json();' in line:
        new_lines.append(line)
        new_lines.append('      if (data.duration) setLastProvingTime(`${data.duration}s`);\n')
    elif '  }' in line and 'success: boolean;' in lines[lines.index(line)-1]:
        # Skipping the redundant brace later
        new_lines.append(line)
    else:
        new_lines.append(line)

# Fix the redundant brace specifically
final_content = "".join(new_lines)
final_content = final_content.replace('  }\n  }\n}', '  }\n}')

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)
