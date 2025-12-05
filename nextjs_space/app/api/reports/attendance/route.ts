import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, format, differenceInMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const departmentId = searchParams.get('departmentId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    // Build where clause for attendance
    const where: any = {
      clockInTime: {
        gte: start,
        lte: end,
      },
      shiftAssignment: {
        shift: {
          companyId: session.user.companyId,
        },
      },
    };

    if (userId) {
      where.shiftAssignment = {
        ...where.shiftAssignment,
        userId,
      };
    }

    if (departmentId) {
      where.shiftAssignment = {
        ...where.shiftAssignment,
        shift: {
          ...where.shiftAssignment.shift,
          departmentId,
        },
      };
    }

    // Fetch attendance records
    console.log('🔍 Fetching attendance with where clause:', JSON.stringify(where, null, 2));
    const attendanceRecords = await prisma.attendance.findMany({
      where,
      include: {
        shiftAssignment: {
          include: {
            shift: {
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        clockInTime: 'asc',
      },
    });
    console.log('📊 Attendance records found:', attendanceRecords.length);

    // Fetch all shift assignments for the period (to calculate expected days)
    const shiftAssignmentsWhere: any = {
      shift: {
        companyId: session.user.companyId,
        startTime: {
          gte: start,
          lte: end,
        },
      },
    };

    if (userId) {
      shiftAssignmentsWhere.userId = userId;
    }

    if (departmentId) {
      shiftAssignmentsWhere.shift = {
        ...shiftAssignmentsWhere.shift,
        departmentId,
      };
    }

    console.log('🔍 Fetching shift assignments with where clause:', JSON.stringify(shiftAssignmentsWhere, null, 2));
    const allShiftAssignments = await prisma.shiftAssignment.findMany({
      where: shiftAssignmentsWhere,
      include: {
        shift: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    console.log('📊 Shift assignments found:', allShiftAssignments.length);

    // Calculate metrics
    const totalExpectedDays = allShiftAssignments.length;
    const totalWorkedDays = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE'
    ).length;

    const onTimeDays = attendanceRecords.filter(
      (a) => a.status === 'PRESENT'
    ).length;

    const lateDays = attendanceRecords.filter(
      (a) => a.status === 'LATE'
    ).length;

    const absentJustifiedDays = attendanceRecords.filter(
      (a) => a.status === 'ABSENT_JUSTIFIED'
    ).length;

    const absentUnjustifiedDays = attendanceRecords.filter(
      (a) => a.status === 'ABSENT_UNJUSTIFIED'
    ).length;

    const halfDays = attendanceRecords.filter(
      (a) => a.status === 'HALF_DAY'
    ).length;

    const earlyDepartureDays = attendanceRecords.filter(
      (a) => a.status === 'EARLY_DEPARTURE'
    ).length;

    // Calculate total hours worked
    let totalMinutesWorked = 0;
    let totalExpectedMinutes = 0;

    allShiftAssignments.forEach((assignment) => {
      const startTime = new Date(`2000-01-01T${assignment.shift.startTime}`);
      const endTime = new Date(`2000-01-01T${assignment.shift.endTime}`);
      const expectedMinutes = differenceInMinutes(endTime, startTime);
      totalExpectedMinutes += expectedMinutes;

      const attendance = attendanceRecords.find(
        (a) => a.shiftAssignmentId === assignment.id
      );
      if (attendance?.totalMinutes) {
        totalMinutesWorked += attendance.totalMinutes;
      }
    });

    const totalHoursWorked = Math.round(totalMinutesWorked / 60);
    const totalExpectedHours = Math.round(totalExpectedMinutes / 60);

    // Calculate percentages
    const attendanceRate =
      totalExpectedDays > 0
        ? Math.round((totalWorkedDays / totalExpectedDays) * 100)
        : 0;

    const punctualityRate =
      totalWorkedDays > 0
        ? Math.round((onTimeDays / totalWorkedDays) * 100)
        : 0;

    const coverageRate =
      totalExpectedDays > 0
        ? Math.round(
            ((totalWorkedDays + absentJustifiedDays) / totalExpectedDays) * 100
          )
        : 0;

    // Group by user for per-user stats
    const userStats: { [key: string]: any } = {};

    attendanceRecords.forEach((record) => {
      const userId = record.shiftAssignment.user.id;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: record.shiftAssignment.user.id,
          userName: record.shiftAssignment.user.name,
          userEmail: record.shiftAssignment.user.email,
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          absentJustified: 0,
          absentUnjustified: 0,
          halfDays: 0,
          earlyDeparture: 0,
          totalMinutesWorked: 0,
          totalLateMinutes: 0,
        };
      }

      userStats[userId].totalDays++;

      if (record.status === 'PRESENT') userStats[userId].presentDays++;
      if (record.status === 'LATE') {
        userStats[userId].lateDays++;
        userStats[userId].totalLateMinutes += record.minutesLate || 0;
      }
      if (record.status === 'ABSENT_JUSTIFIED') userStats[userId].absentJustified++;
      if (record.status === 'ABSENT_UNJUSTIFIED') userStats[userId].absentUnjustified++;
      if (record.status === 'HALF_DAY') userStats[userId].halfDays++;
      if (record.status === 'EARLY_DEPARTURE') userStats[userId].earlyDeparture++;

      if (record.totalMinutes) {
        userStats[userId].totalMinutesWorked += record.totalMinutes;
      }
    });

    // Calculate user expected days
    const userExpectedDays: { [key: string]: number } = {};
    allShiftAssignments.forEach((assignment) => {
      const userId = assignment.userId;
      if (!userExpectedDays[userId]) {
        userExpectedDays[userId] = 0;
      }
      userExpectedDays[userId]++;
    });

    // Add expected days and rates to user stats
    Object.keys(userStats).forEach((userId) => {
      const expected = userExpectedDays[userId] || 0;
      userStats[userId].expectedDays = expected;
      userStats[userId].attendanceRate =
        expected > 0
          ? Math.round(
              ((userStats[userId].presentDays + userStats[userId].lateDays) /
                expected) *
                100
            )
          : 0;
      userStats[userId].punctualityRate =
        userStats[userId].totalDays > 0
          ? Math.round(
              (userStats[userId].presentDays / userStats[userId].totalDays) * 100
            )
          : 0;
      userStats[userId].totalHoursWorked = Math.round(
        userStats[userId].totalMinutesWorked / 60
      );
      userStats[userId].avgLateMinutes =
        userStats[userId].lateDays > 0
          ? Math.round(
              userStats[userId].totalLateMinutes / userStats[userId].lateDays
            )
          : 0;
    });

    // Daily breakdown
    const dailyBreakdown: { [key: string]: any } = {};

    allShiftAssignments.forEach((assignment) => {
      const dateStr = format(new Date(assignment.shift.startTime), 'yyyy-MM-dd');
      if (!dailyBreakdown[dateStr]) {
        dailyBreakdown[dateStr] = {
          date: dateStr,
          totalExpected: 0,
          present: 0,
          late: 0,
          absentJustified: 0,
          absentUnjustified: 0,
          halfDay: 0,
          earlyDeparture: 0,
        };
      }
      dailyBreakdown[dateStr].totalExpected++;
    });

    attendanceRecords.forEach((record) => {
      if (record.clockInTime) {
        const dateStr = format(new Date(record.clockInTime), 'yyyy-MM-dd');
        if (!dailyBreakdown[dateStr]) {
          dailyBreakdown[dateStr] = {
            date: dateStr,
            totalExpected: 0,
            present: 0,
            late: 0,
            absentJustified: 0,
            absentUnjustified: 0,
            halfDay: 0,
            earlyDeparture: 0,
          };
        }
        if (record.status === 'PRESENT') dailyBreakdown[dateStr].present++;
        if (record.status === 'LATE') dailyBreakdown[dateStr].late++;
        if (record.status === 'ABSENT_JUSTIFIED')
          dailyBreakdown[dateStr].absentJustified++;
        if (record.status === 'ABSENT_UNJUSTIFIED')
          dailyBreakdown[dateStr].absentUnjustified++;
        if (record.status === 'HALF_DAY') dailyBreakdown[dateStr].halfDay++;
        if (record.status === 'EARLY_DEPARTURE')
          dailyBreakdown[dateStr].earlyDeparture++;
      }
    });

    const response = {
      period: {
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      },
      summary: {
        totalExpectedDays,
        totalWorkedDays,
        onTimeDays,
        lateDays,
        absentJustifiedDays,
        absentUnjustifiedDays,
        halfDays,
        earlyDepartureDays,
        totalHoursWorked,
        totalExpectedHours,
        attendanceRate,
        punctualityRate,
        coverageRate,
      },
      userStats: Object.values(userStats),
      dailyBreakdown: Object.values(dailyBreakdown).sort((a: any, b: any) =>
        a.date.localeCompare(b.date)
      ),
    };

    console.log('✅ Returning report:', {
      totalExpectedDays,
      totalWorkedDays,
      attendanceRate,
      userStatsCount: Object.values(userStats).length,
      dailyBreakdownCount: Object.values(dailyBreakdown).length
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
