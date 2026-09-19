/**
 * NTS Travel Services - Polling Engine
 * Manages Separate Morning and Return Polls, Duplicate Vote Prevention, Capacity Tracking
 *
 * FUTURE BACKEND:
 * In production, wrap vote submissions in database transactions (SELECT ... FOR UPDATE)
 * to prevent race conditions when multiple students vote for the last seat simultaneously.
 */

import { storage } from './storage.js';
import { showToast } from './utils.js';

export class NTSPollingManager {
  /**
   * Get voting statistics for a specific bus and journey type
   */
  static getBusVoteCount(busId, journeyType = 'morning') {
    const votes = storage.getVotes();
    return votes.filter(v => v.busId === busId && v.journeyType === journeyType).length;
  }

  /**
   * Get aggregated demand breakdown by stop for a journey type
   */
  static getDemandByStop(journeyType = 'morning') {
    const votes = storage.getVotes().filter(v => v.journeyType === journeyType);
    const stops = storage.getStops();
    const demand = {};

    stops.forEach(s => {
      demand[s.id] = {
        stopId: s.id,
        stopName: s.name,
        count: 0
      };
    });

    votes.forEach(v => {
      if (demand[v.stopId]) {
        demand[v.stopId].count++;
      }
    });

    return Object.values(demand).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }

  /**
   * Submit or update a student's vote for a journey
   */
  static castVote(studentId, busId, stopId, journeyType = 'morning') {
    const polls = storage.getPolls();
    const pollConfig = polls[journeyType];

    // 1. Check if poll is open
    if (!pollConfig || pollConfig.status !== 'Open') {
      return { success: false, error: `The ${journeyType} poll is currently closed.` };
    }

    const bus = storage.getBusById(busId);
    if (!bus) {
      return { success: false, error: 'Selected bus is unavailable.' };
    }

    // 2. Capacity Check (Section 22)
    const currentVotes = this.getBusVoteCount(busId, journeyType);
    const existingVote = storage.getStudentVote(studentId, journeyType);
    const isChangingVoteOnSameBus = existingVote && existingVote.busId === busId;

    if (!isChangingVoteOnSameBus && currentVotes >= bus.capacity && !pollConfig.allowOverflow) {
      return {
        success: false,
        error: `Bus ${bus.number} is full (${currentVotes}/${bus.capacity} seats reserved). Please choose another bus.`
      };
    }

    // 3. Prevent duplicate votes & allow updating (Section 4 & 23)
    let votes = storage.getVotes();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (existingVote) {
      // Update existing vote
      votes = votes.map(v => {
        if (v.studentId === studentId && v.journeyType === journeyType) {
          return {
            ...v,
            busId,
            stopId,
            timestamp: timeStr
          };
        }
        return v;
      });
    } else {
      // Record new vote
      votes.push({
        id: 'vote-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        studentId,
        busId,
        stopId,
        journeyType,
        timestamp: timeStr
      });
    }

    storage.saveVotes(votes);

    // Also register or update initial waiting boarding record
    storage.updateBoardingStatus(studentId, busId, stopId, journeyType, 'Waiting', 'system');

    const stop = storage.getStopById(stopId);
    const stopName = stop ? stop.name : 'your chosen stop';

    return {
      success: true,
      message: `Your seat request has been recorded. You are scheduled to board at: ${stopName}`,
      stopName,
      busNumber: bus.number
    };
  }

  /**
   * Cancel / Clear a vote
   */
  static cancelVote(studentId, journeyType = 'morning') {
    let votes = storage.getVotes();
    votes = votes.filter(v => !(v.studentId === studentId && v.journeyType === journeyType));
    storage.saveVotes(votes);
    return { success: true, message: 'Your seat selection has been cancelled.' };
  }
}
