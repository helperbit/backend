We should implement a new utxo selector; this selector should minimize fee while
also compacting other outputs. The algorithm should select the best fit output and
should add more little output to compact them.


utxo.selector ({
    set: utxoset,
    value: 12.0,
    bestInputNumber: 4
})

bestInputNumber: if selected tx are less than this number, add little tx to compact them
value: value to spend
set: a list of { amount: 12, tx: 'asfdfsf', n: 1 }

return a subset of set, null if the amount is not present, 

For example, we have this utxo set:

[ 1.5, 0.7, 0.01, 0.32, 0.003, 0.0003, 0.1, 0.43, 0.005 ]


We need to spend:

1.6 BTC -> (1.5 + 0.1) + (0.005 + 0.0003)
0.9 BTC -> (0.7 + 0.32) + (0.005 + 0.0003)
