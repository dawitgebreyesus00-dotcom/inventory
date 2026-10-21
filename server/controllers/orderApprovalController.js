import OrderApproval from '../models/OrderApproval.js';
import Order from '../models/Order.js';

// Get pending approvals (Admin only)
export const getPendingApprovals = async (req, res) => {
  try {
    const approvals = await OrderApproval.find({ status: 'pending' })
      .populate('order')
      .populate('requestedBy', 'name email')
      .sort({ priority: -1, requestDate: 1 });

    res.json(approvals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve order (Admin only)
export const approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const approval = await OrderApproval.findById(id);
    if (!approval) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    approval.status = 'approved';
    approval.approvedBy = req.user.id;
    approval.approvalDate = new Date();
    approval.notes = notes;

    await approval.save();

    // Update order status
    await Order.findByIdAndUpdate(approval.order, { 
      status: 'processing',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    res.json({ message: 'Order approved successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Reject order (Admin only)
export const rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const approval = await OrderApproval.findById(id);
    if (!approval) {
      return res.status(404).json({ message: 'Approval request not found' });
    }

    approval.status = 'rejected';
    approval.approvedBy = req.user.id;
    approval.approvalDate = new Date();
    approval.rejectionReason = rejectionReason;

    await approval.save();

    // Update order status
    await Order.findByIdAndUpdate(approval.order, { 
      status: 'cancelled',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      rejectionReason
    });

    res.json({ message: 'Order rejected successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};