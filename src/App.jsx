import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Layout, 
  Table, 
  Tag, 
  Button, 
  Form, 
  Input, 
  Select, 
  Card, 
  Typography, 
  Space, 
  Popconfirm, 
  message, 
  Row, 
  Col, 
  Statistic,
  ConfigProvider,
  theme
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  SyncOutlined,
  CopyOutlined,
  BugOutlined,
  ApiOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const App = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/errors`);
      setErrors(res.data);
    } catch (err) {
      message.error('Failed to fetch errors');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      let responseData = values.response;
      try {
        if (typeof values.response === 'string' && (values.response.trim().startsWith('{') || values.response.trim().startsWith('['))) {
          responseData = JSON.parse(values.response);
        }
      } catch (e) {
        // Keep as string if not valid JSON
      }

      await axios.post(`${API_BASE_URL}/errors`, { ...values, response: responseData });
      message.success('Error logged successfully');
      form.resetFields();
      fetchErrors();
    } catch (err) {
      message.error('Failed to log error');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${API_BASE_URL}/errors/${id}`, { status });
      message.success('Status updated');
      fetchErrors();
    } catch (err) {
      message.error('Failed to update status');
    }
  };

  const deleteError = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/errors/${id}`);
      message.success('Error deleted');
      fetchErrors();
    } catch (err) {
      message.error('Failed to delete error');
    }
  };

  const copyResponse = (response) => {
    const text = typeof response === 'object' ? JSON.stringify(response, null, 2) : response;
    navigator.clipboard.writeText(text);
    message.info('Response copied to clipboard');
  };

  const columns = [
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: (method) => {
        let color = 'blue';
        if (method === 'GET') color = 'green';
        if (method === 'POST') color = 'geekblue';
        if (method === 'DELETE') color = 'volcano';
        if (method === 'PUT' || method === 'PATCH') color = 'orange';
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{method}</Tag>;
      },
    },
    {
      title: 'API Endpoint',
      dataIndex: 'api',
      key: 'api',
      render: (text) => <Text code>{text}</Text>,
    },
    {
      title: 'Response',
      dataIndex: 'response',
      key: 'response',
      ellipsis: true,
      render: (response) => (
        <Space>
          <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
            {typeof response === 'object' ? JSON.stringify(response) : response}
          </Text>
          <Button 
            type="link" 
            size="small" 
            icon={<CopyOutlined />} 
            onClick={() => copyResponse(response)}
          />
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        let icon = <SyncOutlined spin />;
        let color = 'processing';
        if (status === 'success') {
          icon = <CheckCircleOutlined />;
          color = 'success';
        } else if (status === 'backlog') {
          icon = <BugOutlined />;
          color = 'warning';
        }
        return <Tag icon={icon} color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          <Select 
            value={record.status} 
            style={{ width: 120 }} 
            onChange={(value) => handleStatusChange(record._id, value)}
          >
            <Option value="pending">Pending</Option>
            <Option value="success">Success</Option>
            <Option value="backlog">Backlog</Option>
          </Select>
          <Popconfirm
            title="Delete error"
            description="Are you sure to delete this error log?"
            onConfirm={() => deleteError(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const [activeFilter, setActiveFilter] = useState('all');

  const stats = {
    total: errors.length,
    pending: errors.filter(e => e.status === 'pending').length,
    success: errors.filter(e => e.status === 'success').length,
    backlog: errors.filter(e => e.status === 'backlog').length,
  };

  const filteredErrors = activeFilter === 'all' 
    ? errors 
    : errors.filter(e => e.status === activeFilter);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: isDarkMode ? '#001529' : '#fff', 
          padding: '0 50px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}>
          <Title level={3} style={{ color: isDarkMode ? 'white' : '#001529', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BugOutlined /> ErrorTracker Pro
          </Title>
          <Button 
            type="text" 
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} 
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ color: isDarkMode ? 'white' : '#001529' }}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </Header>

        <Content style={{ padding: '24px 50px' }}>
          <Space direction="vertical" size="large" style={{ display: 'flex' }}>
            {/* Statistics */}
            <Row gutter={16}>
              <Col span={6}>
                <Card 
                  bordered={false} 
                  hoverable 
                  onClick={() => setActiveFilter('all')}
                  style={{ 
                    cursor: 'pointer', 
                    border: activeFilter === 'all' ? '1px solid #6366f1' : '1px solid transparent',
                    background: activeFilter === 'all' ? 'rgba(99, 102, 241, 0.1)' : '' 
                  }}
                >
                  <Statistic 
                    title="Total Logs" 
                    value={stats.total} 
                    prefix={<ApiOutlined />} 
                    valueStyle={{ color: '#fff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card 
                  bordered={false} 
                  hoverable 
                  onClick={() => setActiveFilter('pending')}
                  style={{ 
                    cursor: 'pointer', 
                    border: activeFilter === 'pending' ? '1px solid #1677ff' : '1px solid transparent',
                    background: activeFilter === 'pending' ? 'rgba(22, 119, 255, 0.1)' : ''
                  }}
                >
                  <Statistic 
                    title="Pending" 
                    value={stats.pending} 
                    prefix={<SyncOutlined spin />} 
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card 
                  bordered={false} 
                  hoverable 
                  onClick={() => setActiveFilter('success')}
                  style={{ 
                    cursor: 'pointer', 
                    border: activeFilter === 'success' ? '1px solid #52c41a' : '1px solid transparent',
                    background: activeFilter === 'success' ? 'rgba(82, 196, 26, 0.1)' : ''
                  }}
                >
                  <Statistic 
                    title="Success" 
                    value={stats.success} 
                    prefix={<CheckCircleOutlined />} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card 
                  bordered={false} 
                  hoverable 
                  onClick={() => setActiveFilter('backlog')}
                  style={{ 
                    cursor: 'pointer', 
                    border: activeFilter === 'backlog' ? '1px solid #faad14' : '1px solid transparent',
                    background: activeFilter === 'backlog' ? 'rgba(250, 173, 20, 0.1)' : ''
                  }}
                >
                  <Statistic 
                    title="Backlog" 
                    value={stats.backlog} 
                    prefix={<BugOutlined />} 
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Form Section */}
            <Card title={<><PlusOutlined /> Log New API Error</>} variant="outlined">
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ method: 'GET' }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="api"
                      label="API Endpoint"
                      rules={[{ required: true, message: 'Please enter API endpoint' }]}
                    >
                      <Input placeholder="e.g. /api/users/profile" />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item
                      name="method"
                      label="Method"
                      rules={[{ required: true }]}
                    >
                      <Select>
                        <Option value="GET">GET</Option>
                        <Option value="POST">POST</Option>
                        <Option value="PUT">PUT</Option>
                        <Option value="PATCH">PATCH</Option>
                        <Option value="DELETE">DELETE</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="response"
                      label="Error Response (JSON or String)"
                      rules={[{ required: true, message: 'Please enter response body' }]}
                    >
                      <Input.TextArea placeholder='{"error": "Unauthorized"}' autoSize={{ minRows: 1, maxRows: 4 }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label=" ">
                      <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                        Add Log
                      </Button>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            {/* Table Section */}
            <Card title={<><BugOutlined /> Error Logs {activeFilter !== 'all' && <Tag color="blue">{activeFilter.toUpperCase()} FILTER ACTIVE</Tag>}</>}>
              <Table 
                columns={columns} 
                dataSource={filteredErrors.map(e => ({ ...e, key: e._id }))} 
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Space>
        </Content>

        <Footer style={{ textAlign: 'center' }}>
          ErrorTracker Pro ©2026 Created with Ant Design
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
