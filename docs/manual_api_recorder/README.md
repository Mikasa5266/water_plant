# Manual API Recorder

用于“人工操作功能 + 代理/抓包获取真实 API 请求”。

## 适用场景

当自动探索脚本无法稳定走完整个业务功能链时，使用本工具更稳：

1. 启动一个可视化浏览器
2. 人工在浏览器中操作目标系统
3. 工具在同一会话中抓取真实请求
4. 输出 HAR、原始 JSON、接口汇总 JSON、接口汇总 MD

## 运行方式

```bash
pip install playwright
playwright install chromium
python record_manual_session.py ^
  --url "http://目标网站" ^
  --output-dir "E:\输出目录"
```

## 使用步骤

1. 运行脚本
2. 浏览器自动打开
3. 在浏览器里手工执行目标功能
   - 进入页面
   - 输入查询条件
   - 点击查询/分页/详情/新建等动作
4. 操作完成后，直接关闭浏览器窗口
5. 脚本自动整理结果

## 输出文件

- `manual_session.har`
  浏览器 HAR 抓包文件

- `manual_capture_raw.json`
  原始请求明细，含方法、URL、参数、响应

- `manual_capture_summary.json`
  去重后的接口清单

- `manual_capture_summary.md`
  便于人工查看的 Markdown 总结

## 调用链

人工操作功能
-> 浏览器真实发起请求
-> Playwright request/response hook 捕获请求
-> 同时导出 HAR
-> 生成原始 JSON
-> 去重整理为接口清单 JSON
-> 生成人工可读 MD 汇总

## 说明

- 这个工具抓到的是“真实发生过的请求”
- 请求方法、URL、query、body、状态码都会被记录
- 如果某个功能没有被人工触发，对应接口不会出现在结果里

