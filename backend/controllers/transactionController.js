import mongoose from "mongoose";
import { validationResult } from "express-validator";
import { Transaction } from "../models/Transaction.js";

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export async function listTransactions(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: req.user.id };
  if (req.query.type === "income" || req.query.type === "expense") {
    filter.type = req.query.type;
  }
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }

  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  return res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function getTransaction(req, res) {
  const tx = await Transaction.findOne({
    _id: req.params.id,
    user: req.user.id,
  }).lean();
  if (!tx) {
    return res.status(404).json({ message: "Transaction not found" });
  }
  return res.json(tx);
}

export async function createTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, amount, type, date, medium, category } = req.body;
  const tx = await Transaction.create({
    user: req.user.id,
    title,
    amount: Number(amount),
    type,
    date: new Date(date),
    medium: medium ?? "Other",
    category: category ?? "",
  });
  return res.status(201).json(tx);
}

export async function updateTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updates = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.amount !== undefined) updates.amount = Number(req.body.amount);
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.date !== undefined) updates.date = new Date(req.body.date);
  if (req.body.medium !== undefined) updates.medium = req.body.medium;
  if (req.body.category !== undefined) updates.category = req.body.category;

  const tx = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!tx) {
    return res.status(404).json({ message: "Transaction not found" });
  }
  return res.json(tx);
}

export async function deleteTransaction(req, res) {
  const result = await Transaction.deleteOne({ _id: req.params.id, user: req.user.id });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Transaction not found" });
  }
  return res.status(204).send();
}

/** Dashboard summary: current vs previous month totals and % change */
export async function getSummary(req, res) {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const now = new Date();
  const curStart = startOfMonth(now);
  const prevStart = addMonths(curStart, -1);
  const nextStart = addMonths(curStart, 1);

  const pipeline = [
    {
      $match: {
        user: userId,
        date: { $gte: prevStart, $lt: nextStart },
      },
    },
    {
      $facet: {
        currentIncome: [
          { $match: { date: { $gte: curStart, $lt: nextStart }, type: "income" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        currentExpense: [
          { $match: { date: { $gte: curStart, $lt: nextStart }, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        prevIncome: [
          { $match: { date: { $gte: prevStart, $lt: curStart }, type: "income" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        prevExpense: [
          { $match: { date: { $gte: prevStart, $lt: curStart }, type: "expense" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        currentCount: [
          { $match: { date: { $gte: curStart, $lt: nextStart } } },
          { $count: "n" },
        ],
        prevCount: [
          { $match: { date: { $gte: prevStart, $lt: curStart } } },
          { $count: "n" },
        ],
        currentVolume: [
          { $match: { date: { $gte: curStart, $lt: nextStart } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        prevVolume: [
          { $match: { date: { $gte: prevStart, $lt: curStart } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
      },
    },
  ];

  const [row] = await Transaction.aggregate(pipeline);
  const pick = (arr) => (arr?.[0]?.total ?? 0);
  const pickCount = (arr) => (arr?.[0]?.n ?? 0);

  const totalIncome = pick(row.currentIncome);
  const totalSpending = pick(row.currentExpense);
  const prevIncome = pick(row.prevIncome);
  const prevSpending = pick(row.prevExpense);
  const totalTransactions = pickCount(row.currentCount);
  const prevTransactions = pickCount(row.prevCount);
  const volume = pick(row.currentVolume);
  const prevVolume = pick(row.prevVolume);

  function pctChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  return res.json({
    totalIncome: { value: totalIncome, changePercent: pctChange(totalIncome, prevIncome) },
    totalSpending: { value: totalSpending, changePercent: pctChange(totalSpending, prevSpending) },
    totalTransactions: {
      count: totalTransactions,
      volume,
      changePercent: pctChange(volume, prevVolume),
      countChangePercent: pctChange(totalTransactions, prevTransactions),
    },
  });
}

function sortSeriesByPeriod(granularity, series) {
  return [...series].sort((a, b) => {
    const ka = a.date;
    const kb = b.date;
    if (granularity === "weekly") {
      const pa = /^(\d{4})-W(\d+)$/.exec(ka);
      const pb = /^(\d{4})-W(\d+)$/.exec(kb);
      if (pa && pb) {
        const sa = parseInt(pa[1], 10) * 100 + parseInt(pa[2], 10);
        const sb = parseInt(pb[1], 10) * 100 + parseInt(pb[2], 10);
        return sa - sb;
      }
    }
    if (granularity === "monthly") {
      return ka.localeCompare(kb);
    }
    return new Date(ka).getTime() - new Date(kb).getTime();
  });
}

/** Income/expense buckets: granularity=daily|weekly|monthly (query: from, to optional) */
export async function getTimeseries(req, res) {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const granularity = ["daily", "weekly", "monthly"].includes(req.query.granularity)
    ? req.query.granularity
    : "daily";

  const now = new Date();
  let from;
  let to;

  const userRange = Boolean(req.query.from && req.query.to);

  if (userRange) {
    from = new Date(req.query.from);
    to = new Date(req.query.to);
  } else if (granularity === "daily") {
    from = startOfMonth(now);
    to = addMonths(from, 1);
  } else if (granularity === "weekly") {
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    from = new Date(now);
    from.setDate(from.getDate() - 84);
    from.setHours(0, 0, 0, 0);
  } else {
    to = new Date(now);
    to.setHours(23, 59, 59, 999);
    from = new Date(now);
    from.setMonth(from.getMonth() - 12);
    from.setHours(0, 0, 0, 0);
  }

  let groupStage;
  if (granularity === "daily") {
    groupStage = {
      $group: {
        _id: {
          period: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    };
  } else if (granularity === "weekly") {
    groupStage = {
      $group: {
        _id: {
          period: {
            $concat: [
              { $toString: { $isoWeekYear: "$date" } },
              "-W",
              {
                $cond: [
                  { $lt: [{ $isoWeek: "$date" }, 10] },
                  { $concat: ["0", { $toString: { $isoWeek: "$date" } }] },
                  { $toString: { $isoWeek: "$date" } },
                ],
              },
            ],
          },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    };
  } else {
    groupStage = {
      $group: {
        _id: {
          period: { $dateToString: { format: "%Y-%m", date: "$date" } },
          type: "$type",
        },
        total: { $sum: "$amount" },
      },
    };
  }

  const dateMatch = userRange
    ? { $gte: from, $lte: to }
    : granularity === "daily"
      ? { $gte: from, $lt: to }
      : { $gte: from, $lte: to };

  const pipeline = [
    {
      $match: {
        user: userId,
        date: dateMatch,
      },
    },
    groupStage,
    { $sort: { "_id.period": 1 } },
  ];

  const rows = await Transaction.aggregate(pipeline);
  const byPeriod = new Map();
  for (const r of rows) {
    const p = r._id.period;
    if (!byPeriod.has(p)) {
      byPeriod.set(p, { date: p, income: 0, expense: 0 });
    }
    const cell = byPeriod.get(p);
    if (r._id.type === "income") cell.income = r.total;
    else cell.expense = r.total;
  }

  const series = sortSeriesByPeriod(granularity, Array.from(byPeriod.values()));
  return res.json({ series, granularity });
}
