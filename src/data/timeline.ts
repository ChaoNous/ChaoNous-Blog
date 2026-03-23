// Timeline data configuration file
// Used to manage data for the timeline page

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
	startDate: string;
	endDate?: string; // If empty, it means current
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: {
		name: string;
		url: string;
		type: "website" | "certificate" | "project" | "other";
	}[];
	icon?: string; // Iconify icon name
	color?: string;
	featured?: boolean;
}

export const timelineData: TimelineItem[] = [
	{
		id: "current-study",
		title: "在读计算机科学与技术",
		description:
			"目前正在攻读计算机科学与技术专业，专注于 Web 开发与软件工程。",
		type: "education",
		startDate: "2022-09-01",
		location: "北京",
		organization: "北京理工大学",
		skills: ["Java", "Python", "JavaScript", "HTML/CSS", "MySQL"],
		achievements: [
			"当前绩点: 3.6/4.0",
			"完成数据结构与算法课程项目",
			"参与多个基于课程的项目开发",
		],
		icon: "material-symbols:school",
		color: "#059669",
		featured: true,
	},
	{
		id: "summer-internship-2024",
		title: "前端开发实习生",
		description: "在一家互联网公司进行暑期实习，参与 Web 应用的前端开发。",
		type: "work",
		startDate: "2024-07-01",
		endDate: "2024-08-31",
		location: "北京",
		organization: "TechStart 互联网公司",
		position: "前端开发实习生",
		skills: ["React", "JavaScript", "CSS3", "Git", "Figma"],
		achievements: [
			"完成用户界面组件开发",
			"学习了团队协作与代码规范",
			"获得优秀实习表现证书",
		],
		icon: "material-symbols:work",
		color: "#DC2626",
		featured: true,
	},
	{
		id: "web-development-course",
		title: "完成全栈 Web 开发在线课程",
		description:
			"完成了一门全栈 Web 开发在线课程，系统学习了前端和后端开发技术。",
		type: "achievement",
		startDate: "2024-01-15",
		endDate: "2024-05-30",
		organization: "Mooc 网站",
		skills: ["HTML", "CSS", "JavaScript", "Node.js", "Express"],
		achievements: [
			"获得课程结业证书",
			"完成 5 个实践项目",
			"掌握全栈开发基础知识",
		],
		links: [
			{
				name: "课程证书",
				url: "https://certificates.example.com/web-dev",
				type: "certificate",
			},
		],
		icon: "material-symbols:verified",
		color: "#059669",
	},
	{
		id: "student-management-system",
		title: "学生管理系统课程设计",
		description: "数据库课程的期末结课项目，开发了完整的学生信息管理系统。",
		type: "project",
		startDate: "2023-11-01",
		endDate: "2023-12-15",
		skills: ["Java", "MySQL", "Swing", "JDBC"],
		achievements: [
			"获得优秀课程设计成绩",
			"实现完整的增删改查功能",
			"学习了数据库设计与优化",
		],
		icon: "material-symbols:database",
		color: "#EA580C",
	},
	{
		id: "programming-contest",
		title: "校级编程竞赛",
		description: "参加了由大学举办的编程竞赛，提高了算法与编程能力。",
		type: "achievement",
		startDate: "2023-10-20",
		location: "北京理工大学",
		organization: "计算机学院",
		skills: ["C++", "Algorithms", "Data Structures"],
		achievements: [
			"荣获校级三等奖",
			"提升了算法思维能力",
			"巩固了编程基础",
		],
		icon: "material-symbols:emoji-events",
		color: "#7C3AED",
	},
	{
		id: "part-time-tutor",
		title: "兼职编程导师",
		description: "为高中生提供编程辅导，帮助他们学习 Python 基础。",
		type: "work",
		startDate: "2023-09-01",
		endDate: "2024-01-31",
		position: "编程导师",
		skills: ["Python", "Teaching", "Communication"],
		achievements: [
			"帮助 3 名学生掌握 Python 基础知识",
			"提升了表达与沟通能力",
			"获得了教学经验",
		],
		icon: "material-symbols:school",
		color: "#059669",
	},
	{
		id: "high-school-graduation",
		title: "高中毕业",
		description:
			"以优异的成绩从高中毕业，并被北京理工大学计算机科学与技术专业录取。",
		type: "education",
		startDate: "2019-09-01",
		endDate: "2022-06-30",
		location: "山东济南",
		organization: "济南第一中学",
		achievements: [
			"高考成绩：620分",
			"荣获市级三好学生",
			"数学竞赛省级二等奖",
		],
		icon: "material-symbols:school",
		color: "#2563EB",
	},
	{
		id: "first-programming-experience",
		title: "首次编程体验",
		description:
			"在高中的信息技术课上首次接触编程，开始学习 Python 基础语法。",
		type: "education",
		startDate: "2021-03-01",
		skills: ["Python", "Basic Programming Concepts"],
		achievements: [
			"完成了第一个“Hello World”程序",
			"学习了基础循环与条件语句",
			"培养了对编程的兴趣",
		],
		icon: "material-symbols:code",
		color: "#7C3AED",
	},
];

// Get timeline statistics
export const getTimelineStats = () => {
	const total = timelineData.length;
	const byType = {
		education: timelineData.filter((item) => item.type === "education")
			.length,
		work: timelineData.filter((item) => item.type === "work").length,
		project: timelineData.filter((item) => item.type === "project").length,
		achievement: timelineData.filter((item) => item.type === "achievement")
			.length,
	};

	return { total, byType };
};

// Get timeline items by type
export const getTimelineByType = (type?: string) => {
	if (!type || type === "all") {
		return timelineData.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
	}
	return timelineData
		.filter((item) => item.type === type)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get featured timeline items
export const getFeaturedTimeline = () => {
	return timelineData
		.filter((item) => item.featured)
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() -
				new Date(a.startDate).getTime(),
		);
};

// Get current ongoing items
export const getCurrentItems = () => {
	return timelineData.filter((item) => !item.endDate);
};

// Calculate total work experience
export const getTotalWorkExperience = () => {
	const workItems = timelineData.filter((item) => item.type === "work");
	let totalMonths = 0;

	workItems.forEach((item) => {
		const startDate = new Date(item.startDate);
		const endDate = item.endDate ? new Date(item.endDate) : new Date();
		const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
		const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
		totalMonths += diffMonths;
	});

	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
