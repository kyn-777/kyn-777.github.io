// 修改缓存对象结构
const calculationCache = {
    internal: {},
    external: {},
    costs: {} // 用于缓存成本计算结果
};

// 添加缓存清理函数
function clearOldCache() {
    const now = Date.now();
    const cacheTimeout = 30 * 60 * 1000; // 30分钟缓存过期
    
    for (let type in calculationCache) {
        for (let key in calculationCache[type]) {
            if (calculationCache[type][key].timestamp && (now - calculationCache[type][key].timestamp > cacheTimeout)) {
                delete calculationCache[type][key];
            }
        }
    }
}

function showCalculator() {
    const printType = document.getElementById('printType').value;
    const calculatorForm = document.getElementById('calculatorForm');
    const copiesGroup = document.getElementById('copiesGroup');
    const totalCostGroup = document.getElementById('totalCostGroup');

    calculatorForm.style.display = 'block';
    
    if (printType === 'internal') {
        copiesGroup.style.display = 'block';
        totalCostGroup.style.display = 'none';
    } else {
        copiesGroup.style.display = 'none';
        totalCostGroup.style.display = 'block';
    }

    // 添加输入提示
    const pageCountInput = document.getElementById('pageCount');
    const copiesInput = document.getElementById('copies');
    const totalCostInput = document.getElementById('totalCost');
    
    pageCountInput.setAttribute('placeholder', '请输入页数（必须为偶数）');
    copiesInput.setAttribute('placeholder', '请输入印数（≥100）');
    totalCostInput.setAttribute('placeholder', '请输入目标总费用');
    
    // 设置最小值和步长
    pageCountInput.setAttribute('step', '2');
    copiesInput.setAttribute('step', '1');
    totalCostInput.setAttribute('step', '0.01');
}

function validateInput(pageCount, copies, totalCost) {
    const errors = [];
    
    if (pageCount < 2) {
        errors.push('页数必须大于等于2');
    }
    
    if (pageCount % 2 !== 0) {
        errors.push('页数必须为偶数');
    }
    
    if (copies && copies < 100) {
        errors.push('印数必须大于等于100');
    }
    
    if (totalCost && totalCost <= 0) {
        errors.push('总费用必须大于0');
    }
    
    if (pageCount > 1000) {
        errors.push('页数似乎过大，请确认是否正确');
    }
    
    if (copies && copies > 10000) {
        errors.push('印数似乎过大，请确认是否正确');
    }
    
    return errors;
}

function calculate() {
    const printType = document.getElementById('printType').value;
    const bookSpec = document.getElementById('bookSpec').value;
    const pageCount = parseInt(document.getElementById('pageCount').value);
    const copies = parseInt(document.getElementById('copies').value);
    const totalCost = parseFloat(document.getElementById('totalCost').value);
    
    const errors = validateInput(pageCount, copies, totalCost);
    if (errors.length > 0) {
        alert('输入错误：\n' + errors.join('\n'));
        return;
    }
    
    let results = document.getElementById('results');
    let calculationDetails = document.getElementById('calculationDetails');
    let finalResult = document.getElementById('finalResult');
    
    results.style.display = 'block';
    calculationDetails.innerHTML = '';
    
    // 生成缓存键
    const cacheKey = `${bookSpec}_${pageCount}`;
    
    if (printType === 'internal') {
        // 检查缓存
        if (calculationCache.internal[cacheKey]?.[copies]) {
            const cached = calculationCache.internal[cacheKey][copies];
            displayResults(cached.printingCost, cached.postProcessingCost, cached.bindingCost);
            return;
        }
        
        // 计算并缓存结果
        let printingCost = 0, postProcessingCost = 0, bindingCost = 0;
        calculateInternalPrinting(bookSpec, pageCount, copies);
        
        // 存入缓存
        if (!calculationCache.internal[cacheKey]) {
            calculationCache.internal[cacheKey] = {};
        }
        calculationCache.internal[cacheKey][copies] = {
            printingCost,
            postProcessingCost,
            bindingCost
        };
    } else {
        calculateExternalPrinting(bookSpec, pageCount, totalCost);
    }
}

function calculateInternalPrinting(bookSpec, pageCount, copies) {
    let printingCost = 0;
    let postProcessingCost = 0;
    let bindingCost = 0;
    
    // 装订价格（塑封）统一计算
    bindingCost = 0.2 * copies;
    
    // 根据不同规格和印数范围计算费用
    switch(bookSpec) {
        case '16pb': // 16开平装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.05 * (pageCount / 2) * copies;
                postProcessingCost = 2 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.046 * (pageCount / 2) * copies;
                postProcessingCost = 1.8 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = 1.6 * copies + 300;
            }
            break;
            
        case '16pc': // 16开平装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.12 * (pageCount / 2) * copies;
                postProcessingCost = 2 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.1 * (pageCount / 2) * copies;
                postProcessingCost = 1.8 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.08 * (pageCount / 2) * copies;
                postProcessingCost = 1.6 * copies + 300;
            }
            break;
            
        case '16hb': // 16开精装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.05 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 8.93) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.046 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 8.22) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 7.8) * copies;
            }
            break;
            
        case '16hc': // 16开精装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.12 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 8.93) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.1 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 8.22) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.08 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 7.8) * copies;
            }
            break;
            
        case '32pb': // 32开平装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = 1.7 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.032 * (pageCount / 2) * copies;
                postProcessingCost = 1.4 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.028 * (pageCount / 2) * copies;
                postProcessingCost = 1.2 * copies + 300;
            }
            break;
            
        case '32pc': // 32开平装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.09 * (pageCount / 2) * copies;
                postProcessingCost = 1.7 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.066 * (pageCount / 2) * copies;
                postProcessingCost = 1.4 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.006 * (pageCount / 2) * copies;
                postProcessingCost = 1.2 * copies + 300;
            }
            break;
            
        case '32hb': // 32开精装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 6.55) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.032 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 5.78) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.028 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 5.3) * copies;
            }
            break;
            
        case '32hc': // 32开精装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.09 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 6.55) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.066 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 5.78) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.006 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 5.3) * copies;
            }
            break;
    }
    
    displayResults(printingCost, postProcessingCost, bindingCost);
}

function calculateExternalPrinting(bookSpec, pageCount, totalCost) {
    // 生成缓存键
    const cacheKey = `${bookSpec}_${pageCount}_${totalCost}`;
    
    // 检查缓存
    if (calculationCache.external[cacheKey]) {
        const cached = calculationCache.external[cacheKey];
        if (Date.now() - cached.timestamp < 30 * 60 * 1000) { // 30分钟内的缓存有效
            document.getElementById('calculationDetails').innerHTML = cached.html;
            return;
        }
    }
    
    let results = document.getElementById('calculationDetails');
    let html = '<h3>建议印数方案</h3>';
    
    // 定义印数范围和步长策略
    const ranges = [
        { min: 100, max: 499, initialStep: 50 },
        { min: 500, max: 999, initialStep: 50 },
        { min: 1000, max: 5000, initialStep: 100 }
    ];
    
    // 存储找到的方案
    let solutions = [];
    
    // 遍历每个印数范围寻找解决方案
    for (let range of ranges) {
        let solution = findOptimalCopiesEfficient(bookSpec, pageCount, totalCost, range);
        if (solution) {
            solutions.push(solution);
        }
    }
    
    // 按照成本差异排序
    solutions.sort((a, b) => a.costDiff - b.costDiff);
    
    // 只显示最好的3个方案
    solutions.slice(0, 3).forEach(solution => {
        if (solution.costDiff / totalCost <= 0.1) { // 只显示误差在10%以内的方案
            html += generateSolutionHTML(solution);
        }
    });
    
    if (html === '<h3>建议印数方案</h3>') {
        html += '<p>未找到合适的印数方案，请调整总费用后重试。</p>';
    }
    
    // 保存到缓存
    calculationCache.external[cacheKey] = {
        html: html,
        timestamp: Date.now()
    };
    
    results.innerHTML = html;
}

// 优化的印数查找函数
function findOptimalCopiesEfficient(bookSpec, pageCount, targetCost, range) {
    const cacheKey = `${bookSpec}_${pageCount}_${range.min}_${range.max}`;
    let bestSolution = null;
    let bestCostDiff = Infinity;
    
    // 使用递进式搜索策略
    let step = range.initialStep;
    let currentMin = range.min;
    let currentMax = range.max;
    
    while (step >= 1) {
        for (let copies = currentMin; copies <= currentMax; copies += step) {
            // 检查成本计算缓存
            const costCacheKey = `${bookSpec}_${pageCount}_${copies}`;
            let costs;
            
            if (calculationCache.costs[costCacheKey]) {
                costs = calculationCache.costs[costCacheKey];
            } else {
                costs = calculateCostsForCopy(bookSpec, pageCount, copies);
                calculationCache.costs[costCacheKey] = costs;
            }
            
            const totalCost = costs.printingCost + costs.postProcessingCost + costs.bindingCost;
            const costDiff = Math.abs(totalCost - targetCost);
            
            if (costDiff < bestCostDiff) {
                bestCostDiff = costDiff;
                bestSolution = {
                    copies: copies,
                    ...costs,
                    totalCost: totalCost,
                    costDiff: costDiff
                };
            }
            
            // 提前退出条件
            if (totalCost > targetCost * 1.2) {
                break;
            }
        }
        
        if (bestSolution) {
            // 缩小搜索范围
            currentMin = Math.max(range.min, bestSolution.copies - step);
            currentMax = Math.min(range.max, bestSolution.copies + step);
            step = Math.floor(step / 2);
        } else {
            break;
        }
    }
    
    return bestSolution;
}

// 单次成本计算函数
function calculateCostsForCopy(bookSpec, pageCount, copies) {
    let printingCost = 0;
    let postProcessingCost = 0;
    let bindingCost = 0.2 * copies;
    
    calculateCostsForCopies(bookSpec, pageCount, copies, 
        (p, pp) => {
            printingCost = p;
            postProcessingCost = pp;
        });
    
    return {
        printingCost,
        postProcessingCost,
        bindingCost
    };
}

// 生成方案HTML的辅助函数
function generateSolutionHTML(solution) {
    return `
        <div class="calculation-detail">
            <h4>方案 ${solution.copies >= 1000 ? '(1000册以上)' : solution.copies >= 500 ? '(500-999册)' : '(100-499册)'}</h4>
            <p>建议印数：${solution.copies}册</p>
            <p>印制费用：¥${solution.printingCost.toFixed(2)}</p>
            <p>后期费用：¥${solution.postProcessingCost.toFixed(2)}</p>
            <p>装订费用：¥${solution.bindingCost.toFixed(2)}</p>
            <p>实际总费用：¥${solution.totalCost.toFixed(2)}</p>
            <p>与目标费用差异：¥${solution.costDiff.toFixed(2)} (${(solution.costDiff/solution.totalCost*100).toFixed(1)}%)</p>
        </div>
    `;
}

function calculateCostsForCopies(bookSpec, pageCount, copies, callback) {
    let printingCost = 0;
    let postProcessingCost = 0;
    
    // 复用社内印刷的计算逻辑
    switch(bookSpec) {
        case '16pb': // 16开平装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.05 * (pageCount / 2) * copies;
                postProcessingCost = 2 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.046 * (pageCount / 2) * copies;
                postProcessingCost = 1.8 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = 1.6 * copies + 300;
            }
            break;
            
        case '16pc': // 16开平装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.12 * (pageCount / 2) * copies;
                postProcessingCost = 2 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.1 * (pageCount / 2) * copies;
                postProcessingCost = 1.8 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.08 * (pageCount / 2) * copies;
                postProcessingCost = 1.6 * copies + 300;
            }
            break;
            
        case '16hb': // 16开精装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.05 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 8.93) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.046 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 8.22) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 7.8) * copies;
            }
            break;
            
        case '16hc': // 16开精装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.12 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 8.93) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.1 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 8.22) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.08 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 7.8) * copies;
            }
            break;
            
        case '32pb': // 32开平装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = 1.7 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.032 * (pageCount / 2) * copies;
                postProcessingCost = 1.4 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.028 * (pageCount / 2) * copies;
                postProcessingCost = 1.2 * copies + 300;
            }
            break;
            
        case '32pc': // 32开平装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.09 * (pageCount / 2) * copies;
                postProcessingCost = 1.7 * copies + 300;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.066 * (pageCount / 2) * copies;
                postProcessingCost = 1.4 * copies + 300;
            } else if (copies >= 1000) {
                printingCost = 0.006 * (pageCount / 2) * copies;
                postProcessingCost = 1.2 * copies + 300;
            }
            break;
            
        case '32hb': // 32开精装黑白
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.042 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 6.55) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.032 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 5.78) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.028 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 5.3) * copies;
            }
            break;
            
        case '32hc': // 32开精装四色
            if (copies >= 100 && copies <= 499) {
                printingCost = 0.09 * (pageCount / 2) * copies;
                postProcessingCost = (0.09 * pageCount / 16 + 6.55) * copies;
            } else if (copies >= 500 && copies <= 999) {
                printingCost = 0.066 * (pageCount / 2) * copies;
                postProcessingCost = (0.08 * pageCount / 16 + 5.78) * copies;
            } else if (copies >= 1000) {
                printingCost = 0.006 * (pageCount / 2) * copies;
                postProcessingCost = (0.07 * pageCount / 16 + 5.3) * copies;
            }
            break;
    }
    
    callback(printingCost, postProcessingCost);
}

function formatCurrency(amount) {
    // 保留2位小数，四舍五入
    return Math.round(amount * 100) / 100;
}

function displayResults(printingCost, postProcessingCost, bindingCost) {
    // 对所有金额进行格式化
    printingCost = formatCurrency(printingCost);
    postProcessingCost = formatCurrency(postProcessingCost);
    bindingCost = formatCurrency(bindingCost);
    const total = formatCurrency(printingCost + postProcessingCost + bindingCost);
    
    const printType = document.getElementById('printType').value;
    const bookSpec = document.getElementById('bookSpec').value;
    const pageCount = parseInt(document.getElementById('pageCount').value);
    const copies = parseInt(document.getElementById('copies').value);
    
    let calculationDetails = document.getElementById('calculationDetails');
    let finalResult = document.getElementById('finalResult');
    
    // 获取规格的中文名称
    const specNames = {
        '16pb': '16开平装黑白',
        '16pc': '16开平装四色',
        '16hb': '16开精装黑白',
        '16hc': '16开精装四色',
        '32pb': '32开平装黑白',
        '32pc': '32开平装四色',
        '32hb': '32开精装黑白',
        '32hc': '32开精装四色'
    };

    // 获取印制单价和后期处理单价
    let printingRate, postProcessingRate, postProcessingBase;
    if (copies >= 100 && copies <= 499) {
        switch(bookSpec) {
            case '16pb': 
                printingRate = '0.05';
                postProcessingRate = '2';
                postProcessingBase = '300';
                break;
            case '16pc': 
                printingRate = '0.12';
                postProcessingRate = '2';
                postProcessingBase = '300';
                break;
            case '16hb': 
                printingRate = '0.05';
                postProcessingRate = '0.09';
                postProcessingBase = '8.93';
                break;
            case '16hc': 
                printingRate = '0.12';
                postProcessingRate = '0.09';
                postProcessingBase = '8.93';
                break;
            case '32pb': 
                printingRate = '0.042';
                postProcessingRate = '1.7';
                postProcessingBase = '300';
                break;
            case '32pc': 
                printingRate = '0.09';
                postProcessingRate = '1.7';
                postProcessingBase = '300';
                break;
            case '32hb': 
                printingRate = '0.042';
                postProcessingRate = '0.09';
                postProcessingBase = '6.55';
                break;
            case '32hc': 
                printingRate = '0.09';
                postProcessingRate = '0.09';
                postProcessingBase = '6.55';
                break;
        }
    } else if (copies >= 500 && copies <= 999) {
        switch(bookSpec) {
            case '16pb': 
                printingRate = '0.046';
                postProcessingRate = '1.8';
                postProcessingBase = '300';
                break;
            case '16pc': 
                printingRate = '0.1';
                postProcessingRate = '1.8';
                postProcessingBase = '300';
                break;
            case '16hb': 
                printingRate = '0.046';
                postProcessingRate = '0.08';
                postProcessingBase = '8.22';
                break;
            case '16hc': 
                printingRate = '0.1';
                postProcessingRate = '0.08';
                postProcessingBase = '8.22';
                break;
            case '32pb': 
                printingRate = '0.032';
                postProcessingRate = '1.4';
                postProcessingBase = '300';
                break;
            case '32pc': 
                printingRate = '0.066';
                postProcessingRate = '1.4';
                postProcessingBase = '300';
                break;
            case '32hb': 
                printingRate = '0.032';
                postProcessingRate = '0.08';
                postProcessingBase = '5.78';
                break;
            case '32hc': 
                printingRate = '0.066';
                postProcessingRate = '0.08';
                postProcessingBase = '5.78';
                break;
        }
    } else if (copies >= 1000) {
        switch(bookSpec) {
            case '16pb': 
                printingRate = '0.042';
                postProcessingRate = '1.6';
                postProcessingBase = '300';
                break;
            case '16pc': 
                printingRate = '0.08';
                postProcessingRate = '1.6';
                postProcessingBase = '300';
                break;
            case '16hb': 
                printingRate = '0.042';
                postProcessingRate = '0.07';
                postProcessingBase = '7.8';
                break;
            case '16hc': 
                printingRate = '0.08';
                postProcessingRate = '0.07';
                postProcessingBase = '7.8';
                break;
            case '32pb': 
                printingRate = '0.028';
                postProcessingRate = '1.2';
                postProcessingBase = '300';
                break;
            case '32pc': 
                printingRate = '0.006';
                postProcessingRate = '1.2';
                postProcessingBase = '300';
                break;
            case '32hb': 
                printingRate = '0.028';
                postProcessingRate = '0.07';
                postProcessingBase = '5.3';
                break;
            case '32hc': 
                printingRate = '0.006';
                postProcessingRate = '0.07';
                postProcessingBase = '5.3';
                break;
        }
    }

    let html = `
        <div class="calculation-detail">
            <h3>计算明细 - ${specNames[bookSpec]}</h3>
            
            <h4>1. 印制费用计算</h4>
            <p>计算公式：印制单价 × (页数÷2) × 印数</p>
            <p>${printingRate} × (${pageCount}÷2) × ${copies} = ¥${printingCost.toFixed(2)}</p>
            
            <h4>2. 后期费用计算</h4>
    `;

    // 根据不同规格显示不同的后期费用计算公式
    if (bookSpec.includes('h')) { // 精装版本
        html += `
            <p>计算公式：(${pageCount}页 ÷ 16 × ${postProcessingRate} + ${postProcessingBase}) × ${copies}册</p>
            <p>= (${pageCount} ÷ 16 × ${postProcessingRate} + ${postProcessingBase}) × ${copies} = ¥${postProcessingCost.toFixed(2)}</p>
        `;
    } else { // 平装版本
        html += `
            <p>计算公式：${postProcessingRate} × ${copies}册 + ${postProcessingBase}</p>
            <p>= ${postProcessingRate} × ${copies} + ${postProcessingBase} = ¥${postProcessingCost.toFixed(2)}</p>
        `;
    }

    html += `
            <h4>3. 装订费用计算</h4>
            <p>计算公式：0.2 × ${copies}册</p>
            <p>= ¥${bindingCost.toFixed(2)}</p>
            
            <h4>4. 总费用</h4>
            <p>印制费用 + 后期费用 + 装订费用</p>
            <p>¥${printingCost.toFixed(2)} + ¥${postProcessingCost.toFixed(2)} + ¥${bindingCost.toFixed(2)} = ¥${total.toFixed(2)}</p>
        </div>
    `;

    calculationDetails.innerHTML = html;
    finalResult.innerHTML = `<div class="final-result">总费用：¥${total.toFixed(2)}</div>`;
}

// 在页面加载时启动定期清理缓存
setInterval(clearOldCache, 5 * 60 * 1000); // 每5分钟清理一次过期缓存 