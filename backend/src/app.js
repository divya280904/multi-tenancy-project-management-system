const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AppZex API is running",
  });
});

const authRoutes = require('./routes/auth.routes');
const adminAgencyRoutes = require('./routes/admin.agency.routes');
const agencyWorkspaceRoutes = require('./routes/agency.workspace.routes');
const clientRoutes = require('./routes/client.routes');
const clientPortalRoutes = require('./routes/client.portal.routes');
const projectRoutes = require('./routes/project.routes');
const milestoneRoutes = require('./routes/milestone.routes');
const taskRoutes = require('./routes/task.routes');
const meetingRoutes = require('./routes/meeting.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');
const aiRoutes = require('./routes/ai.routes');

app.use('/auth', authRoutes);
app.use('/admin/agencies', adminAgencyRoutes);
app.use('/agency/clients', clientRoutes);
app.use('/notifications', notificationRoutes);
app.use('/agency/projects', fileRoutes);
app.use('/agency/projects', projectRoutes);
app.use('/agency', milestoneRoutes);
app.use('/agency', taskRoutes);
app.use('/agency', meetingRoutes);
app.use('/agency', feedbackRoutes);
app.use('/agency', agencyWorkspaceRoutes);
app.use('/client-portal', clientPortalRoutes);
app.use('/', aiRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled app error:', err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

module.exports = app;